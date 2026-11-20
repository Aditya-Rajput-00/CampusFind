
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");
const Item = require("../src/models/Item");
const Claim = require("../src/models/Claim");

const TEST_USER_ID = "64b000000000000000000001";

async function makeRequest(path = "/api/claims", options = {}) {
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

test("GET /api/claims rejects requests without authentication", async () => {
    const response = await makeRequest();
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
        success: false,
        message: "Authentication required",
        errors: [],
    });
});

test("GET /api/claims/pending denies an authenticated student", async (t) => {
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
            `http://127.0.0.1:${address.port}/api/claims/pending`,
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

test("GET /api/claims applies search, status, pagination, and returns totals", async (t) => {
    const token = installAuthenticatedUser(t);
    const originals = {
        claimFind: Claim.find,
        claimCount: Claim.countDocuments,
        itemFind: Item.find,
        userFind: User.find,
    };
    const records = [{ _id: "claim-1", status: "APPROVED" }];
    let capturedFilter;

    const idQuery = (ids) => ({
        select: () => ({ lean: async () => ids.map((_id) => ({ _id })) }),
    });
    Item.find = (filter) => {
        assert.deepEqual(filter, { title: /keys/i });
        return idQuery(["item-1"]);
    };
    User.find = (filter) => {
        assert.deepEqual(filter, { $or: [{ name: /keys/i }, { email: /keys/i }] });
        return idQuery(["user-1"]);
    };
    Claim.find = (filter) => {
        capturedFilter = filter;
        const query = {
            populate: () => query,
            sort: () => query,
            skip: (value) => {
                assert.equal(value, 5);
                return query;
            },
            limit: async (value) => {
                assert.equal(value, 5);
                return records;
            },
        };
        return query;
    };
    Claim.countDocuments = async (filter) => {
        assert.deepEqual(filter, capturedFilter);
        return 12;
    };
    t.after(() => {
        Claim.find = originals.claimFind;
        Claim.countDocuments = originals.claimCount;
        Item.find = originals.itemFind;
        User.find = originals.userFind;
    });

    const response = await makeRequest(
        "/api/claims?search=keys&status=APPROVED&page=2&limit=5",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(capturedFilter.status, "APPROVED");
    assert.deepEqual(capturedFilter.$and[0].$or, [
        { "proof.description": /keys/i },
        { "proof.additionalDetails": /keys/i },
        { itemId: { $in: ["item-1"] } },
        { claimantId: { $in: ["user-1"] } },
    ]);
    assert.deepEqual(body.data, records);
    assert.deepEqual(body.pagination, {
        page: 2,
        limit: 5,
        totalRecords: 12,
        totalPages: 3,
    });
});

test("GET /api/claims rejects invalid status and pagination query values", async (t) => {
    const token = installAuthenticatedUser(t);
    const response = await makeRequest("/api/claims?status=UNKNOWN&page=0&limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body.errors.map(({ path }) => path).sort(), [
        "limit",
        "page",
        "status",
    ]);
});

test("GET /api/claims keeps student results scoped to the claimant", async (t) => {
    const token = installAuthenticatedUser(t, "student");
    const originalFind = Claim.find;
    const originalCount = Claim.countDocuments;
    let capturedFilter;
    Claim.find = (filter) => {
        capturedFilter = filter;
        const query = {
            populate: () => query,
            sort: () => query,
            skip: () => query,
            limit: async () => [],
        };
        return query;
    };
    Claim.countDocuments = async () => 0;
    t.after(() => {
        Claim.find = originalFind;
        Claim.countDocuments = originalCount;
    });

    const response = await makeRequest("/api/claims?status=PENDING", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(capturedFilter, {
        claimantId: TEST_USER_ID,
        status: "PENDING",
    });
    assert.deepEqual(body.data, []);
});
