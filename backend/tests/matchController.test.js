
const test = require("node:test");
const assert = require("node:assert/strict");

const Match = require("../src/models/Match");
const Item = require("../src/models/Item");
const Notification = require("../src/models/Notification");

const {
    getMatches,
    getPendingMatches,
    createMatch,
    updateMatchStatus,
} = require("../src/controllers/matchController");

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

const createMatchQuery = (expectedMatches) => ({
    populate() {
        return this;
    },
    sort() {
        return Promise.resolve(expectedMatches);
    },
});

test("getMatches returns all matches", async () => {
    const originalFind = Match.find;

    try {
        const expectedMatches = [{ _id: "match-1" }];

        Match.find = () => createMatchQuery(expectedMatches);

        const res = createResponse();
        const { next, state } = createNext();

        await getMatches({}, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.deepEqual(res.body.data, expectedMatches);
    } finally {
        restoreMethod(Match, "find", originalFind);
    }
});

test("getPendingMatches fetches only pending matches", async () => {
    const originalFind = Match.find;

    try {
        const expectedMatches = [
            { _id: "match-1", status: "PENDING" },
        ];
        let capturedFilter;

        Match.find = (filter) => {
            capturedFilter = filter;
            return createMatchQuery(expectedMatches);
        };

        const res = createResponse();
        const { next, state } = createNext();

        await getPendingMatches({}, res, next);

        assert.equal(state.called, false);
        assert.deepEqual(capturedFilter, { status: "PENDING" });
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body.data, expectedMatches);
    } finally {
        restoreMethod(Match, "find", originalFind);
    }
});

test("getMatches forwards database errors to next", async () => {
    const originalFind = Match.find;

    try {
        const expectedError = new Error("Database error");

        Match.find = () => ({
            populate() {
                return this;
            },
            sort() {
                return Promise.reject(expectedError);
            },
        });

        const res = createResponse();
        const { next, state } = createNext();

        await getMatches({}, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, expectedError);
    } finally {
        restoreMethod(Match, "find", originalFind);
    }
});

test("createMatch rejects missing required fields", async () => {
    const res = createResponse();
    const { next, state } = createNext();

    await createMatch(
        { body: {} },
        res,
        next
    );

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        "Lost item, found item, and match score are required"
    );
    assert.equal(state.called, false);
});

test("createMatch rejects a missing lost item", async () => {
    const originalFindById = Item.findById;

    try {
        Item.findById = async (id) => {
            if (id === "found-1") {
                return {
                    _id: "found-1",
                    title: "Found Wallet",
                    reportedBy: "reporter-2",
                };
            }

            return null;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await createMatch(
            {
                body: {
                    lostItemId: "missing-item",
                    foundItemId: "found-1",
                    matchScore: 0.9,
                },
            },
            res,
            next
        );

        assert.equal(res.statusCode, 404);
        assert.equal(
            res.body.message,
            "Lost or found item not found"
        );
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("createMatch creates a match and notifies both reporters", async () => {
    const originalFindById = Item.findById;
    const originalCreateMatch = Match.create;
    const originalCreateNotification = Notification.create;

    try {
        const lostItem = {
            _id: "lost-1",
            title: "Lost Wallet",
            reportedBy: "reporter-1",
        };

        const foundItem = {
            _id: "found-1",
            title: "Found Wallet",
            reportedBy: "reporter-2",
        };

        let savedMatchData;
        const notifications = [];

        Item.findById = async (id) => {
            if (id === "lost-1") return lostItem;
            if (id === "found-1") return foundItem;
            return null;
        };

        Match.create = async (data) => {
            savedMatchData = data;
            return { _id: "match-1", ...data };
        };

        Notification.create = async (data) => {
            notifications.push(data);
            return data;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await createMatch(
            {
                body: {
                    lostItemId: "lost-1",
                    foundItemId: "found-1",
                    matchScore: 0.95,
                },
            },
            res,
            next
        );

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);

        assert.deepEqual(savedMatchData, {
            lostItemId: "lost-1",
            foundItemId: "found-1",
            matchScore: 0.95,
        });

        assert.equal(res.body.data.match._id, "match-1");
        assert.equal(notifications.length, 2);
        assert.equal(notifications[0].userId, "reporter-1");
        assert.equal(notifications[1].userId, "reporter-2");
        assert.equal(notifications[0].type, "MATCH");
        assert.equal(notifications[1].type, "MATCH");
    } finally {
        restoreMethod(Item, "findById", originalFindById);
        restoreMethod(Match, "create", originalCreateMatch);
        restoreMethod(
            Notification,
            "create",
            originalCreateNotification
        );
    }
});

test("updateMatchStatus rejects an unsupported status", async () => {
    const res = createResponse();
    const { next, state } = createNext();

    await updateMatchStatus(
        {
            body: { status: "PENDING" },
            params: { id: "match-1" },
        },
        res,
        next
    );

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        "Status must be CONFIRMED or REJECTED"
    );
    assert.equal(state.called, false);
});

test("updateMatchStatus returns 404 when the match does not exist", async () => {
    const originalUpdate = Match.findByIdAndUpdate;

    try {
        Match.findByIdAndUpdate = async () => null;

        const res = createResponse();
        const { next, state } = createNext();

        await updateMatchStatus(
            {
                body: { status: "CONFIRMED" },
                params: { id: "missing-match" },
            },
            res,
            next
        );

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Match not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(
            Match,
            "findByIdAndUpdate",
            originalUpdate
        );
    }
});

test("updateMatchStatus returns 404 when a related item is missing", async () => {
    const originalUpdate = Match.findByIdAndUpdate;
    const originalFindById = Item.findById;

    try {
        Match.findByIdAndUpdate = async () => ({
            _id: "match-1",
            lostItemId: "lost-1",
            foundItemId: "missing-found",
        });

        Item.findById = async (id) => {
            if (id === "lost-1") {
                return { _id: "lost-1", title: "Lost Wallet" };
            }

            return null;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await updateMatchStatus(
            {
                body: { status: "CONFIRMED" },
                params: { id: "match-1" },
            },
            res,
            next
        );

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Related item not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(
            Match,
            "findByIdAndUpdate",
            originalUpdate
        );
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("updateMatchStatus confirms a match, updates both items, and notifies both reporters", async () => {
    const originalUpdate = Match.findByIdAndUpdate;
    const originalFindById = Item.findById;
    const originalCreateNotification = Notification.create;

    try {
        const match = {
            _id: "match-1",
            lostItemId: "lost-1",
            foundItemId: "found-1",
            status: "CONFIRMED",
        };

        const lostItem = {
            _id: "lost-1",
            title: "Lost Wallet",
            reportedBy: "reporter-1",
            status: "ACTIVE",
            async save() {
                return this;
            },
        };

        const foundItem = {
            _id: "found-1",
            title: "Found Wallet",
            reportedBy: "reporter-2",
            status: "ACTIVE",
            async save() {
                return this;
            },
        };

        const notifications = [];

        Match.findByIdAndUpdate = async (id, update, options) => {
            assert.equal(id, "match-1");
            assert.deepEqual(update, { status: "CONFIRMED" });
            assert.deepEqual(options, {
                new: true,
                runValidators: true,
            });
            return match;
        };

        Item.findById = async (id) => {
            if (id === "lost-1") return lostItem;
            if (id === "found-1") return foundItem;
            return null;
        };

        Notification.create = async (data) => {
            notifications.push(data);
            return data;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await updateMatchStatus(
            {
                body: { status: "CONFIRMED" },
                params: { id: "match-1" },
            },
            res,
            next
        );

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(lostItem.status, "MATCHED");
        assert.equal(foundItem.status, "MATCHED");
        assert.equal(notifications.length, 2);
        assert.equal(notifications[0].userId, "reporter-1");
        assert.equal(notifications[1].userId, "reporter-2");
        assert.equal(notifications[0].title, "Match Confirmed");
        assert.equal(notifications[1].title, "Match Confirmed");
        assert.equal(res.body.data.match, match);
    } finally {
        restoreMethod(
            Match,
            "findByIdAndUpdate",
            originalUpdate
        );
        restoreMethod(Item, "findById", originalFindById);
        restoreMethod(
            Notification,
            "create",
            originalCreateNotification
        );
    }
});

test("updateMatchStatus rejects a match and notifies both reporters", async () => {
    const originalUpdate = Match.findByIdAndUpdate;
    const originalFindById = Item.findById;
    const originalCreateNotification = Notification.create;

    try {
        const match = {
            _id: "match-1",
            lostItemId: "lost-1",
            foundItemId: "found-1",
            status: "REJECTED",
        };

        const lostItem = {
            _id: "lost-1",
            title: "Lost Wallet",
            reportedBy: "reporter-1",
            status: "ACTIVE",
        };

        const foundItem = {
            _id: "found-1",
            title: "Found Wallet",
            reportedBy: "reporter-2",
            status: "ACTIVE",
        };

        const notifications = [];

        Match.findByIdAndUpdate = async () => match;

        Item.findById = async (id) => {
            if (id === "lost-1") return lostItem;
            if (id === "found-1") return foundItem;
            return null;
        };

        Notification.create = async (data) => {
            notifications.push(data);
            return data;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await updateMatchStatus(
            {
                body: { status: "REJECTED" },
                params: { id: "match-1" },
            },
            res,
            next
        );

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);

        // Rejection should not change either item's status.
        assert.equal(lostItem.status, "ACTIVE");
        assert.equal(foundItem.status, "ACTIVE");

        assert.equal(notifications.length, 2);
        assert.equal(notifications[0].userId, "reporter-1");
        assert.equal(notifications[1].userId, "reporter-2");
        assert.equal(notifications[0].title, "Match Rejected");
        assert.equal(notifications[1].title, "Match Rejected");
        assert.equal(res.body.data.match, match);
    } finally {
        restoreMethod(
            Match,
            "findByIdAndUpdate",
            originalUpdate
        );
        restoreMethod(Item, "findById", originalFindById);
        restoreMethod(
            Notification,
            "create",
            originalCreateNotification
        );
    }
});
