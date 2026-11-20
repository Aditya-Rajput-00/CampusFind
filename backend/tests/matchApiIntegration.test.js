
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");
const Item = require("../src/models/Item");
const Match = require("../src/models/Match");

const TEST_USER_ID = "64b000000000000000000001";

async function makeRequest(path = "/api/matches", options = {}) {
    const server = app.listen(0);

    try {
        const address = server.address();

        return await fetch(
            `http://127.0.0.1:${address.port}${path}`,
            options
        );
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}

function installAuthenticatedUser(t, role = "staff") {
    const originalSecret = process.env.JWT_SECRET;
    const originalFindById = User.findById;
    process.env.JWT_SECRET = "campusfind-test-secret";
    User.findById = async (id) => ({
        _id: id,
        role,
        accountStatus: "approved",
    });
    t.after(() => {
        User.findById = originalFindById;
        if (originalSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = originalSecret;
    });
    return jwt.sign(
        { userId: TEST_USER_ID, role },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );
}

test("GET /api/matches rejects requests without authentication", async () => {
    const response = await makeRequest();
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
        success: false,
        message: "Authentication required",
        errors: [],
    });
});

test("GET /api/matches/pending denies an authenticated student", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    const originalFindById = User.findById;

    process.env.JWT_SECRET = "campusfind-test-secret";

    User.findById = async (id) => {
        assert.equal(id, TEST_USER_ID);

        return {
            _id: TEST_USER_ID,
            role: "student",
            accountStatus: "approved",
        };
    };

    t.after(() => {
        User.findById = originalFindById;

        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    const token = jwt.sign(
        {
            userId: TEST_USER_ID,
            role: "student",
        },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );

    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/matches/pending`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const body = await response.json();

        assert.equal(response.status, 403);
        assert.deepEqual(body, {
            success: false,
            message: "Access denied",
            errors: [],
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
});

test("GET /api/matches applies search, status, pagination, and returns totals", async (t) => {
    const token = installAuthenticatedUser(t);
    const originalItemFind = Item.find;
    const originalMatchFind = Match.find;
    const originalCountDocuments = Match.countDocuments;
    const records = [{ _id: "match-1", status: "CONFIRMED" }];
    let capturedFilter;

    Item.find = (filter) => {
        assert.deepEqual(filter, { title: /keys/i });
        return {
            select: () => ({ lean: async () => [{ _id: "item-1" }] }),
        };
    };
    Match.find = (filter) => {
        capturedFilter = filter;
        const query = {
            populate: () => query,
            sort: () => query,
            skip: (value) => {
                assert.equal(value, 4);
                return query;
            },
            limit: async (value) => {
                assert.equal(value, 4);
                return records;
            },
        };
        return query;
    };
    Match.countDocuments = async (filter) => {
        assert.deepEqual(filter, capturedFilter);
        return 9;
    };
    t.after(() => {
        Item.find = originalItemFind;
        Match.find = originalMatchFind;
        Match.countDocuments = originalCountDocuments;
    });

    const response = await makeRequest(
        "/api/matches?search=keys&status=CONFIRMED&page=2&limit=4",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(capturedFilter, {
        status: "CONFIRMED",
        $and: [{
            $or: [
                { lostItemId: { $in: ["item-1"] } },
                { foundItemId: { $in: ["item-1"] } },
            ],
        }],
    });
    assert.deepEqual(body.data, records);
    assert.deepEqual(body.pagination, {
        page: 2,
        limit: 4,
        totalRecords: 9,
        totalPages: 3,
    });
});

test("GET /api/matches rejects invalid status and pagination query values", async (t) => {
    const token = installAuthenticatedUser(t);
    const response = await makeRequest(
        "/api/matches?status=OPEN&page=0&limit=101",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body.errors.map(({ path }) => path).sort(), [
        "limit",
        "page",
        "status",
    ]);
});

test("GET /api/matches keeps student results scoped to their reported items", async (t) => {
    const token = installAuthenticatedUser(t, "student");
    const originalItemFind = Item.find;
    const originalMatchFind = Match.find;
    const originalCount = Match.countDocuments;
    let capturedFilter;
    Item.find = (filter) => {
        assert.deepEqual(filter, { reportedBy: TEST_USER_ID });
        return { distinct: async () => ["student-item"] };
    };
    Match.find = (filter) => {
        capturedFilter = filter;
        const query = {
            populate: () => query,
            sort: () => query,
            skip: () => query,
            limit: async () => [],
        };
        return query;
    };
    Match.countDocuments = async () => 0;
    t.after(() => {
        Item.find = originalItemFind;
        Match.find = originalMatchFind;
        Match.countDocuments = originalCount;
    });

    const response = await makeRequest("/api/matches?status=PENDING", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(capturedFilter, {
        $or: [
            { lostItemId: { $in: ["student-item"] } },
            { foundItemId: { $in: ["student-item"] } },
        ],
        status: "PENDING",
    });
    assert.deepEqual(body.data, []);
});
