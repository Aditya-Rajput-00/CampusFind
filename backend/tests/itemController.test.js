
const test = require("node:test");
const assert = require("node:assert/strict");

const Item = require("../src/models/Item");
const Notification = require("../src/models/Notification");

const {
    getItems,
    createItem,
    updateItemStatus,
    returnItem,
    closeItem,
} = require("../src/controllers/itemController");

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

// GET ITEMS TESTS

test("getItems returns items and pagination details", async () => {
    const originals = {
        countDocuments: Item.countDocuments,
        find: Item.find,
    };

    try {
        const expectedItems = [{ _id: "item-1", title: "Lost Keys" }];

        Item.countDocuments = async () => 21;

        Item.find = () => ({
            populate() {
                return this;
            },
            sort() {
                return this;
            },
            skip() {
                return this;
            },
            limit: async () => expectedItems,
        });

        const req = { query: { page: "2", limit: "10" } };
        const res = createResponse();
        const { next, state } = createNext();

        await getItems(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.deepEqual(res.body.data.items, expectedItems);
        assert.deepEqual(res.body.data.pagination, {
            page: 2,
            limit: 10,
            totalItems: 21,
            totalPages: 3,
        });
    } finally {
        restoreMethod(Item, "countDocuments", originals.countDocuments);
        restoreMethod(Item, "find", originals.find);
    }
});

test("getItems passes search and category filters to the model", async () => {
    const originals = {
        countDocuments: Item.countDocuments,
        find: Item.find,
    };

    try {
        let capturedFilter;

        Item.countDocuments = async (filter) => {
            capturedFilter = filter;
            return 0;
        };

        Item.find = (filter) => {
            capturedFilter = filter;

            return {
                populate() {
                    return this;
                },
                sort() {
                    return this;
                },
                skip() {
                    return this;
                },
                limit: async () => [],
            };
        };

        const req = {
            query: {
                search: "wallet",
                category: "Accessories",
                type: "LOST",
                building: "Library",
                status: "ACTIVE",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await getItems(req, res, next);

        assert.equal(state.called, false);
        assert.deepEqual(capturedFilter.$or, [
            { title: { $regex: "wallet", $options: "i" } },
            { description: { $regex: "wallet", $options: "i" } },
        ]);
        assert.equal(capturedFilter.category, "Accessories");
        assert.equal(capturedFilter.type, "LOST");
        assert.deepEqual(capturedFilter["location.building"], {
            $regex: "Library",
            $options: "i",
        });
        assert.equal(capturedFilter.status, "ACTIVE");
    } finally {
        restoreMethod(Item, "countDocuments", originals.countDocuments);
        restoreMethod(Item, "find", originals.find);
    }
});

// NEW TEST: DATABASE ERROR HANDLING

test("getItems forwards database errors to next", async () => {
    const originalCountDocuments = Item.countDocuments;
    const databaseError = new Error("Database error");

    try {
        Item.countDocuments = async () => {
            throw databaseError;
        };

        const req = { query: {} };
        const res = createResponse();
        const { next, state } = createNext();

        await getItems(req, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, databaseError);
        assert.equal(res.statusCode, null);
    } finally {
        restoreMethod(Item, "countDocuments", originalCountDocuments);
    }
});

// CREATE ITEM TESTS

test("createItem rejects missing required fields", async () => {
    const req = { body: {}, user: { userId: "user-1" } };
    const res = createResponse();
    const { next, state } = createNext();

    await createItem(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(state.called, false);
});

test("createItem creates an item with the reporter and image", async () => {
    const originalCreate = Item.create;

    try {
        let savedData;

        Item.create = async (data) => {
            savedData = data;
            return { _id: "item-123", ...data };
        };

        const req = {
            body: {
                title: "Lost Wallet",
                description: "Black wallet",
                category: "Accessories",
                type: "LOST",
                location: { building: "Library" },
                date: "2026-10-16",
            },
            user: { userId: "user-123" },
            file: { filename: "wallet.png" },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await createItem(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.equal(savedData.reportedBy, "user-123");
        assert.deepEqual(savedData.images, ["/uploads/wallet.png"]);
        assert.equal(res.body.data.item._id, "item-123");
    } finally {
        restoreMethod(Item, "create", originalCreate);
    }
});

// UPDATE ITEM STATUS TESTS

test("updateItemStatus rejects an unsupported status", async () => {
    const req = {
        body: { status: "INVALID" },
        params: { id: "item-1" },
    };

    const res = createResponse();
    const { next, state } = createNext();

    await updateItemStatus(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Invalid item status");
    assert.equal(state.called, false);
});

test("updateItemStatus returns 404 when the item does not exist", async () => {
    const originalUpdate = Item.findByIdAndUpdate;

    try {
        Item.findByIdAndUpdate = async () => null;

        const req = {
            body: { status: "VERIFIED" },
            params: { id: "missing-item" },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await updateItemStatus(req, res, next);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Item not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Item, "findByIdAndUpdate", originalUpdate);
    }
});

test("updateItemStatus updates the item and creates a notification", async () => {
    const originalUpdate = Item.findByIdAndUpdate;
    const originalNotificationCreate = Notification.create;

    try {
        const updatedItem = {
            _id: "item-1",
            title: "Lost Keys",
            reportedBy: "user-1",
            status: "VERIFIED",
        };

        let notificationData;

        Item.findByIdAndUpdate = async (id, update, options) => {
            assert.equal(id, "item-1");
            assert.deepEqual(update, { status: "VERIFIED" });
            assert.deepEqual(options, { new: true, runValidators: true });
            return updatedItem;
        };

        Notification.create = async (data) => {
            notificationData = data;
            return data;
        };

        const req = {
            body: { status: "VERIFIED" },
            params: { id: "item-1" },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await updateItemStatus(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.data.item.status, "VERIFIED");
        assert.equal(notificationData.userId, "user-1");
        assert.equal(notificationData.type, "STATUS_UPDATE");
    } finally {
        restoreMethod(Item, "findByIdAndUpdate", originalUpdate);
        restoreMethod(Notification, "create", originalNotificationCreate);
    }
});

// RETURN ITEM TESTS

test("returnItem returns 404 when the item does not exist", async () => {
    const originalFindById = Item.findById;

    try {
        Item.findById = async () => null;

        const req = { params: { id: "missing-item" } };
        const res = createResponse();
        const { next, state } = createNext();

        await returnItem(req, res, next);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Item not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("returnItem rejects an item that has not been verified", async () => {
    const originalFindById = Item.findById;

    try {
        Item.findById = async () => ({
            _id: "item-1",
            title: "Lost Keys",
            status: "ACTIVE",
        });

        const req = { params: { id: "item-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await returnItem(req, res, next);

        assert.equal(res.statusCode, 400);
        assert.equal(
            res.body.message,
            "Item must be verified before it can be returned"
        );
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("returnItem marks a verified item as returned and notifies its reporter", async () => {
    const originalFindById = Item.findById;
    const originalNotificationCreate = Notification.create;

    try {
        const item = {
            _id: "item-1",
            title: "Lost Keys",
            status: "VERIFIED",
            reportedBy: "user-1",
            async save() {
                return this;
            },
        };

        let notificationData;

        Item.findById = async () => item;

        Notification.create = async (data) => {
            notificationData = data;
            return data;
        };

        const req = { params: { id: "item-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await returnItem(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(item.status, "RETURNED");
        assert.equal(res.body.data.item.status, "RETURNED");
        assert.equal(notificationData.userId, "user-1");
        assert.equal(notificationData.title, "Item Returned");
    } finally {
        restoreMethod(Item, "findById", originalFindById);
        restoreMethod(Notification, "create", originalNotificationCreate);
    }
});

// CLOSE ITEM TESTS

test("closeItem returns 404 when the item does not exist", async () => {
    const originalFindById = Item.findById;

    try {
        Item.findById = async () => null;

        const req = { params: { id: "missing-item" } };
        const res = createResponse();
        const { next, state } = createNext();

        await closeItem(req, res, next);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Item not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("closeItem rejects an item that has not been returned", async () => {
    const originalFindById = Item.findById;

    try {
        Item.findById = async () => ({
            _id: "item-1",
            status: "VERIFIED",
            save: async function () {
                return this;
            },
        });

        const req = { params: { id: "item-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await closeItem(req, res, next);

        assert.equal(res.statusCode, 400);
        assert.equal(
            res.body.message,
            "Item must be returned before it can be closed"
        );
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("closeItem closes a returned item", async () => {
    const originalFindById = Item.findById;

    try {
        const item = {
            _id: "item-1",
            status: "RETURNED",
            async save() {
                return this;
            },
        };

        Item.findById = async () => item;

        const req = { params: { id: "item-1" } };
        const res = createResponse();
        const { next, state } = createNext();

        await closeItem(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(item.status, "CLOSED");
        assert.equal(res.body.data.item.status, "CLOSED");
    } finally {
        restoreMethod(Item, "findById", originalFindById);
    }
});
