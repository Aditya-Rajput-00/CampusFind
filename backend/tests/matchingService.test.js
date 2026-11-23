
const test = require("node:test");
const assert = require("node:assert/strict");

const Item = require("../src/models/Item");
const Match = require("../src/models/Match");
const Notification = require("../src/models/Notification");

const {
    MATCH_CONFIG,
    normalizeText,
    calculateTextSimilarity,
    calculateLocationSimilarity,
    calculateMatchScore,
    findMatchingCandidates,
    findAndCreateMatches,
} = require("../src/services/matchingService");

const createItem = (overrides = {}) => ({
    _id: "item-1",
    type: "lost",
    title: "Black Wireless Headphones",
    category: "Electronics",
    description: "Black wireless headphones in a carrying case",
    location: {
        building: "Library",
        area: "Reading Room",
        floor: 2,
    },
    reportedBy: "user-1",
    status: "ACTIVE",
    ...overrides,
});

const restoreMethods = (originals) => {
    for (const [object, method, original] of originals) {
        object[method] = original;
    }
};

// TEXT AND SCORING TESTS

test("normalizeText converts text to lowercase and removes extra spaces", () => {
    assert.equal(
        normalizeText("  Black   Wireless HEADPHONES! "),
        "black wireless headphones"
    );
});

test("calculateTextSimilarity returns 1 for identical text", () => {
    assert.equal(
        calculateTextSimilarity("Black Wallet", "Black Wallet"),
        1
    );
});

test("calculateTextSimilarity returns 0 for empty text", () => {
    assert.equal(calculateTextSimilarity("", "Black Wallet"), 0);
});

test("calculateTextSimilarity calculates word overlap", () => {
    assert.equal(
        calculateTextSimilarity(
            "Black Wireless Headphones",
            "Wireless Black Headphones"
        ),
        1
    );
});

test("calculateLocationSimilarity awards points for matching fields", () => {
    const first = createItem();
    const second = createItem();

    assert.equal(
        calculateLocationSimilarity(first, second),
        15
    );
});

test("calculateLocationSimilarity ignores missing fields", () => {
    const first = createItem({
        location: {
            building: "Library",
            area: "",
            floor: 2,
        },
    });

    const second = createItem();

    assert.equal(
        calculateLocationSimilarity(first, second),
        10
    );
});

test("calculateMatchScore returns 100 for a complete match", () => {
    const lostItem = createItem();
    const foundItem = createItem({ type: "found" });

    assert.equal(
        calculateMatchScore(lostItem, foundItem),
        100
    );
});

test("calculateMatchScore does not award category points when both categories are empty", () => {
    const lostItem = createItem({ category: "" });

    const foundItem = createItem({
        type: "found",
        category: "",
    });

    // 35 title + 25 description + 15 location = 75
    assert.equal(
        calculateMatchScore(lostItem, foundItem),
        75
    );
});

test("matching configuration has a threshold of 60", () => {
    assert.equal(MATCH_CONFIG.threshold, 60);
});

// CANDIDATE SEARCH TESTS

test("findMatchingCandidates searches only opposite-type ACTIVE reports", async () => {
    const originalFind = Item.find;

    try {
        let capturedFilter;

        Item.find = async (filter) => {
            capturedFilter = filter;
            return [];
        };

        await findMatchingCandidates(createItem());

        assert.deepEqual(capturedFilter, {
            _id: { $ne: "item-1" },
            type: "found",
            status: "ACTIVE",
        });
    } finally {
        Item.find = originalFind;
    }
});

test("findMatchingCandidates searches Lost reports for a Found item", async () => {
    const originalFind = Item.find;

    try {
        let capturedFilter;

        Item.find = async (filter) => {
            capturedFilter = filter;
            return [];
        };

        await findMatchingCandidates(
            createItem({ type: "found" })
        );

        assert.equal(capturedFilter.type, "lost");
        assert.equal(capturedFilter.status, "ACTIVE");
    } finally {
        Item.find = originalFind;
    }
});

// AUTOMATIC MATCH CREATION TESTS

test("findAndCreateMatches creates a match for a Lost item and Found candidate", async () => {
    const originals = [
        [Item, "find", Item.find],
        [Match, "create", Match.create],
        [Notification, "create", Notification.create],
    ];

    try {
        const lostItem = createItem();

        const foundItem = createItem({
            _id: "item-2",
            type: "found",
            reportedBy: "user-2",
        });

        const createdMatch = {
            _id: "match-1",
            lostItemId: lostItem._id,
            foundItemId: foundItem._id,
            matchScore: 100,
        };

        let capturedMatch;
        const notifications = [];

        Item.find = async () => [foundItem];

        Match.create = async (data) => {
            capturedMatch = data;
            return createdMatch;
        };

        Notification.create = async (data) => {
            notifications.push(data);
        };

        const result = await findAndCreateMatches(lostItem);

        assert.deepEqual(result, [createdMatch]);
        assert.equal(capturedMatch.lostItemId, "item-1");
        assert.equal(capturedMatch.foundItemId, "item-2");
        assert.equal(capturedMatch.matchScore, 100);
        assert.equal(notifications.length, 2);
        assert.equal(notifications[0].userId, "user-1");
        assert.equal(notifications[1].userId, "user-2");
    } finally {
        restoreMethods(originals);
    }
});

test("findAndCreateMatches works when a Found item is submitted", async () => {
    const originals = [
        [Item, "find", Item.find],
        [Match, "create", Match.create],
        [Notification, "create", Notification.create],
    ];

    try {
        const foundItem = createItem({
            type: "found",
            _id: "item-2",
            reportedBy: "user-2",
        });

        const lostItem = createItem();

        let capturedMatch;

        Item.find = async () => [lostItem];

        Match.create = async (data) => {
            capturedMatch = data;
            return data;
        };

        Notification.create = async () => { };

        await findAndCreateMatches(foundItem);

        assert.equal(capturedMatch.lostItemId, lostItem._id);
        assert.equal(capturedMatch.foundItemId, foundItem._id);
    } finally {
        restoreMethods(originals);
    }
});

test("findAndCreateMatches does not create a match for low-scoring candidates", async () => {
    const originals = [
        [Item, "find", Item.find],
        [Match, "create", Match.create],
        [Notification, "create", Notification.create],
    ];

    try {
        const lostItem = createItem();

        const foundItem = createItem({
            type: "found",
            title: "Red Umbrella",
            category: "Accessories",
            description: "Umbrella found outside",
        });

        Item.find = async () => [foundItem];

        Match.create = async () => {
            assert.fail("Low-scoring candidate should not create a match");
        };

        Notification.create = async () => { };

        const result = await findAndCreateMatches(lostItem);

        assert.deepEqual(result, []);
    } finally {
        restoreMethods(originals);
    }
});

test("findAndCreateMatches ignores invalid item types", async () => {
    const originalFind = Item.find;

    try {
        Item.find = async () => {
            assert.fail("Invalid item should not query candidates");
        };

        const result = await findAndCreateMatches(
            createItem({ type: "unknown" })
        );

        assert.deepEqual(result, []);
    } finally {
        Item.find = originalFind;
    }
});

test("findAndCreateMatches ignores duplicate match errors", async () => {
    const originals = [
        [Item, "find", Item.find],
        [Match, "create", Match.create],
        [Notification, "create", Notification.create],
    ];

    try {
        Item.find = async () => [
            createItem({
                type: "found",
                _id: "item-2",
                reportedBy: "user-2",
            }),
        ];

        Match.create = async () => {
            const error = new Error("Duplicate pair");
            error.code = 11000;
            throw error;
        };

        Notification.create = async () => {
            assert.fail("Duplicate pair must not generate notifications");
        };

        const result = await findAndCreateMatches(createItem());

        assert.deepEqual(result, []);
    } finally {
        restoreMethods(originals);
    }
});

test("findAndCreateMatches does not change item statuses", async () => {
    const originals = [
        [Item, "find", Item.find],
        [Match, "create", Match.create],
        [Notification, "create", Notification.create],
    ];

    try {
        const lostItem = createItem();

        const foundItem = createItem({
            type: "found",
            _id: "item-2",
            reportedBy: "user-2",
        });

        Item.find = async () => [foundItem];

        Match.create = async (data) => data;

        Notification.create = async () => { };

        await findAndCreateMatches(lostItem);

        assert.equal(lostItem.status, "ACTIVE");
        assert.equal(foundItem.status, "ACTIVE");
    } finally {
        restoreMethods(originals);
    }
});
