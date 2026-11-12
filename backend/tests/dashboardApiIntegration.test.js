
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");
const Item = require("../src/models/Item");
const Claim = require("../src/models/Claim");
const Match = require("../src/models/Match");

const TEST_STUDENT_ID = "64b000000000000000000001";
const TEST_STAFF_ID = "64b000000000000000000002";

async function makeRequest(token) {
    const server = app.listen(0);

    try {
        const address = server.address();

        return await fetch(
            `http://127.0.0.1:${address.port}/api/dashboard/stats`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
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

test("GET /api/dashboard/stats rejects requests without authentication", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/dashboard/stats`
        );

        const body = await response.json();

        assert.equal(response.status, 401);
        assert.deepEqual(body, {
            success: false,
            message: "Authentication required",
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

test("GET /api/dashboard/stats denies an authenticated student", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    const originalFindById = User.findById;

    process.env.JWT_SECRET = "campusfind-test-secret";

    User.findById = async (id) => {
        assert.equal(id, TEST_STUDENT_ID);

        return {
            _id: TEST_STUDENT_ID,
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
            userId: TEST_STUDENT_ID,
            role: "student",
        },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await makeRequest(token);
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(body, {
        success: false,
        message: "Access denied",
        errors: [],
    });
});

test("GET /api/dashboard/stats returns statistics to an authenticated staff member", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    const originalUserFindById = User.findById;
    const originalUserCount = User.countDocuments;
    const originalItemCount = Item.countDocuments;
    const originalClaimCount = Claim.countDocuments;
    const originalMatchCount = Match.countDocuments;

    process.env.JWT_SECRET = "campusfind-test-secret";

    User.findById = async (id) => {
        assert.equal(id, TEST_STAFF_ID);

        return {
            _id: TEST_STAFF_ID,
            role: "staff",
            accountStatus: "approved",
        };
    };

    t.after(() => {
        User.findById = originalUserFindById;
        User.countDocuments = originalUserCount;
        Item.countDocuments = originalItemCount;
        Claim.countDocuments = originalClaimCount;
        Match.countDocuments = originalMatchCount;

        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    User.countDocuments = async () => 120;

    Item.countDocuments = async (filter = {}) => {
        if (filter.type === "lost") return 40;
        if (filter.type === "found") return 45;
        if (filter.status === "ACTIVE") return 30;
        if (filter.status === "RETURNED") return 15;

        return 85;
    };

    Claim.countDocuments = async () => 8;
    Match.countDocuments = async () => 5;

    const token = jwt.sign(
        {
            userId: TEST_STAFF_ID,
            role: "staff",
        },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await makeRequest(token);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);

    assert.deepEqual(body.data, {
        totalUsers: 120,
        totalItems: 85,
        lostItems: 40,
        foundItems: 45,
        activeItems: 30,
        returnedItems: 15,
        pendingClaims: 8,
        pendingMatches: 5,
    });
});
