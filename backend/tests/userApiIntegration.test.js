
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");

const TEST_SECRET = "campusfind-test-secret";

const TEST_USER_IDS = {
    student: "64b000000000000000000001",
    admin: "64b000000000000000000002",
};

function createToken(role) {
    process.env.JWT_SECRET = TEST_SECRET;

    return jwt.sign(
        {
            userId: TEST_USER_IDS[role],
            role,
        },
        TEST_SECRET,
        { expiresIn: "5m" }
    );
}

async function makeRequest(path, options = {}) {
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
                if (error) reject(error);
                else resolve();
            });
        });
    }
}

function restoreEnvironment(t) {
    const originalSecret = process.env.JWT_SECRET;

    t.after(() => {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });
}

function mockAuthenticatedUser(t, role, additionalUsers = {}) {
    const originalFindById = User.findById;
    const authenticatedUserId = TEST_USER_IDS[role];

    const authenticatedUser = {
        _id: authenticatedUserId,
        role,
        accountStatus: "approved",
    };

    const users = {
        [authenticatedUserId]: authenticatedUser,
        ...additionalUsers,
    };

    User.findById = async (id) => {
        const userId = id.toString();
        return users[userId] || null;
    };

    t.after(() => {
        User.findById = originalFindById;
    });
}

// Test 1: Authentication required
test("GET /api/users/me rejects requests without authentication", async () => {
    const response = await makeRequest("/api/users/me");
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
        success: false,
        message: "Authentication required",
        errors: [],
    });
});

// Test 2: Students cannot access admin user list
test("GET /api/users denies an authenticated student", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "student");

    const token = createToken("student");

    const response = await makeRequest("/api/users", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const body = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(body, {
        success: false,
        message: "Access denied",
        errors: [],
    });
});

// Test 3: Admin can view pending staff registrations
test("GET /api/users/pending-staff allows admin access", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");

    const originalFind = User.find;

    t.after(() => {
        User.find = originalFind;
    });

    const token = createToken("admin");

    const pendingStaff = [
        {
            _id: "64b000000000000000000003",
            name: "Test Staff",
            email: "staff@example.com",
            role: "staff",
            accountStatus: "pending",
        },
    ];

    User.find = (filter) => {
        assert.deepEqual(filter, {
            role: "staff",
            accountStatus: "pending",
        });

        return {
            select: async (fields) => {
                assert.equal(fields, "-passwordHash");
                return pendingStaff;
            },
        };
    };

    const response = await makeRequest("/api/users/pending-staff", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(
        JSON.stringify(body).includes("passwordHash"),
        false
    );
    assert.equal(
        JSON.stringify(body).includes("staff@example.com"),
        true
    );
});

// Test 4: Students cannot view pending staff registrations
test("GET /api/users/pending-staff denies student access", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "student");

    const token = createToken("student");

    const response = await makeRequest("/api/users/pending-staff", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.message, "Access denied");
});

// Test 5: Admin can approve a pending staff account
test("PATCH /api/users/:id/approve allows admin to approve staff", async (t) => {
    restoreEnvironment(t);

    const staffId = "64b000000000000000000004";

    const staffUser = {
        _id: staffId,
        name: "Test Staff",
        email: "staff@example.com",
        role: "staff",
        accountStatus: "pending",
        save: async function () {
            this.saved = true;
        },
    };

    mockAuthenticatedUser(t, "admin", {
        [staffId]: staffUser,
    });

    const token = createToken("admin");

    const response = await makeRequest(
        `/api/users/${staffId}/approve`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(staffUser.accountStatus, "approved");
    assert.equal(staffUser.saved, true);
});

// Test 6: Admin can reject a pending staff account
test("PATCH /api/users/:id/reject allows admin to reject staff", async (t) => {
    restoreEnvironment(t);

    const staffId = "64b000000000000000000005";

    const staffUser = {
        _id: staffId,
        name: "Test Staff",
        email: "staff@example.com",
        role: "staff",
        accountStatus: "pending",
        save: async function () {
            this.saved = true;
        },
    };

    mockAuthenticatedUser(t, "admin", {
        [staffId]: staffUser,
    });

    const token = createToken("admin");

    const response = await makeRequest(
        `/api/users/${staffId}/reject`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(staffUser.accountStatus, "rejected");
    assert.equal(staffUser.saved, true);
});

// Test 7: Students cannot approve staff accounts
test("PATCH /api/users/:id/approve denies student access", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "student");

    const token = createToken("student");
    const staffId = "64b000000000000000000006";

    const response = await makeRequest(
        `/api/users/${staffId}/approve`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.message, "Access denied");
});
