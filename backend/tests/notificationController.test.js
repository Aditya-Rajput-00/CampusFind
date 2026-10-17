
const test = require("node:test");
const assert = require("node:assert/strict");

const Notification = require("../src/models/Notification");

const {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
} = require("../src/controllers/notificationController");

const createResponse = () => ({
    statusCode: null,
    body: null,

    status(code) {
        this.statusCode = code;
        return this;
    },

    json(data) {
        this.body = data;
        return this;
    },
});

const createNext = () => {
    const state = { called: false, error: null };

    return {
        state,
        next(error) {
            state.called = true;
            state.error = error || null;
        },
    };
};

const restoreMethod = (object, method, original) => {
    object[method] = original;
};

test("getNotifications returns notifications for the logged-in user", async () => {
    const originalFind = Notification.find;

    try {
        const expectedNotifications = [
            { _id: "notification-1", userId: "user-1" },
        ];
        let capturedFilter;

        Notification.find = (filter) => {
            capturedFilter = filter;

            return {
                sort: async (sortOptions) => {
                    assert.deepEqual(sortOptions, { createdAt: -1 });
                    return expectedNotifications;
                },
            };
        };

        const req = { user: { userId: "user-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await getNotifications(req, res, next);

        assert.equal(state.called, false);
        assert.deepEqual(capturedFilter, { userId: "user-1" });
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.deepEqual(res.body.data, expectedNotifications);
    } finally {
        restoreMethod(Notification, "find", originalFind);
    }
});

test("getNotifications forwards database errors to next", async () => {
    const originalFind = Notification.find;

    try {
        const expectedError = new Error("Database error");

        Notification.find = () => ({
            sort: () => Promise.reject(expectedError),
        });

        const req = { user: { userId: "user-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await getNotifications(req, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, expectedError);
    } finally {
        restoreMethod(Notification, "find", originalFind);
    }
});

test("createNotification rejects missing required fields", async () => {
    const res = createResponse();
    const { next, state } = createNext();

    await createNotification(
        { body: { userId: "user-1", type: "CLAIM", title: "Update" } },
        res,
        next
    );

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        "User ID, type, title, and message are required"
    );
    assert.equal(state.called, false);
});

test("createNotification creates a notification successfully", async () => {
    const originalCreate = Notification.create;

    try {
        let savedData;

        Notification.create = async (data) => {
            savedData = data;
            return { _id: "notification-1", ...data };
        };

        const req = {
            body: {
                userId: "user-1",
                type: "CLAIM",
                title: "New Claim",
                message: "Someone submitted a claim.",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await createNotification(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.deepEqual(savedData, {
            userId: "user-1",
            type: "CLAIM",
            title: "New Claim",
            message: "Someone submitted a claim.",
        });
        assert.equal(
            res.body.data.notification._id,
            "notification-1"
        );
    } finally {
        restoreMethod(Notification, "create", originalCreate);
    }
});

test("markAsRead updates only the logged-in user's notification", async () => {
    const originalFindOneAndUpdate = Notification.findOneAndUpdate;

    try {
        const expectedNotification = {
            _id: "notification-1",
            userId: "user-1",
            isRead: true,
        };

        let capturedFilter;
        let capturedUpdate;
        let capturedOptions;

        Notification.findOneAndUpdate = async (filter, update, options) => {
            capturedFilter = filter;
            capturedUpdate = update;
            capturedOptions = options;
            return expectedNotification;
        };

        const req = {
            params: { id: "notification-1" },
            user: { userId: "user-1" },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await markAsRead(req, res, next);

        assert.equal(state.called, false);
        assert.deepEqual(capturedFilter, {
            _id: "notification-1",
            userId: "user-1",
        });
        assert.deepEqual(capturedUpdate, { isRead: true });
        assert.deepEqual(capturedOptions, { new: true });
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.deepEqual(
            res.body.data.notification,
            expectedNotification
        );
    } finally {
        restoreMethod(
            Notification,
            "findOneAndUpdate",
            originalFindOneAndUpdate
        );
    }
});

test("markAsRead returns 404 when the notification is not found", async () => {
    const originalFindOneAndUpdate = Notification.findOneAndUpdate;

    try {
        Notification.findOneAndUpdate = async () => null;

        const req = {
            params: { id: "missing-notification" },
            user: { userId: "user-1" },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await markAsRead(req, res, next);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Notification not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(
            Notification,
            "findOneAndUpdate",
            originalFindOneAndUpdate
        );
    }
});

test("markAsRead forwards database errors to next", async () => {
    const originalFindOneAndUpdate = Notification.findOneAndUpdate;

    try {
        const expectedError = new Error("Database error");

        Notification.findOneAndUpdate = async () => {
            throw expectedError;
        };

        const req = {
            params: { id: "notification-1" },
            user: { userId: "user-1" },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await markAsRead(req, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, expectedError);
    } finally {
        restoreMethod(
            Notification,
            "findOneAndUpdate",
            originalFindOneAndUpdate
        );
    }
});

test("markAllAsRead updates unread notifications for the logged-in user", async () => {
    const originalUpdateMany = Notification.updateMany;

    try {
        let capturedFilter;
        let capturedUpdate;

        Notification.updateMany = async (filter, update) => {
            capturedFilter = filter;
            capturedUpdate = update;
            return { modifiedCount: 3 };
        };

        const req = { user: { userId: "user-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await markAllAsRead(req, res, next);

        assert.equal(state.called, false);
        assert.deepEqual(capturedFilter, {
            userId: "user-1",
            isRead: false,
        });
        assert.deepEqual(capturedUpdate, { isRead: true });
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
    } finally {
        restoreMethod(Notification, "updateMany", originalUpdateMany);
    }
});

test("markAllAsRead succeeds when there are no unread notifications", async () => {
    const originalUpdateMany = Notification.updateMany;

    try {
        Notification.updateMany = async () => ({ modifiedCount: 0 });

        const req = { user: { userId: "user-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await markAllAsRead(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
    } finally {
        restoreMethod(Notification, "updateMany", originalUpdateMany);
    }
});

test("markAllAsRead forwards database errors to next", async () => {
    const originalUpdateMany = Notification.updateMany;

    try {
        const expectedError = new Error("Database error");

        Notification.updateMany = async () => {
            throw expectedError;
        };

        const req = { user: { userId: "user-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await markAllAsRead(req, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, expectedError);
    } finally {
        restoreMethod(Notification, "updateMany", originalUpdateMany);
    }
});
