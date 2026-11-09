
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");

const TEST_SECRET = "campusfind-test-secret";

function createToken(role) {
    process.env.JWT_SECRET = TEST_SECRET;

    return jwt.sign(
        {
            userId: `test-${role}-id`,
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

function restoreUserMethods(t) {
    const originalFind = User.find;
    const originalFindById = User.findById;

    t.after(() => {
        User.find = originalFind;
        User.findById = originalFindById;
    });
}

// Existing test 1: Authentication required
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

// Existing test 2: Students cannot access admin user list
test("GET /api/users denies an authenticated student", async (t) => {
    restoreEnvironment(t);

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

// New test 3: Admin can view pending staff registrations
test("GET /api/users/pending-staff allows admin access", async (t) => {
    restoreEnvironment(t);
    restoreUserMethods(t);

    const token = createToken("admin");

    const pendingStaff = [
        {
            _id: "64b000000000000000000001",
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

// New test 4: Students cannot view pending staff registrations
test("GET /api/users/pending-staff denies student access", async (t) => {
    restoreEnvironment(t);

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

// New test 5: Admin can approve a pending staff account
test("PATCH /api/users/:id/approve allows admin to approve staff", async (t) => {
    restoreEnvironment(t);
    restoreUserMethods(t);

    const token = createToken("admin");
    const staffId = "64b000000000000000000001";

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

    User.findById = async (id) => {
        assert.equal(id, staffId);
        return staffUser;
    };

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

// New test 6: Admin can reject a pending staff account
test("PATCH /api/users/:id/reject allows admin to reject staff", async (t) => {
    restoreEnvironment(t);
    restoreUserMethods(t);

    const token = createToken("admin");
    const staffId = "64b000000000000000000002";

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

    User.findById = async (id) => {
        assert.equal(id, staffId);
        return staffUser;
    };

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

// New test 7: Students cannot approve staff accounts
test("PATCH /api/users/:id/approve denies student access", async (t) => {
    restoreEnvironment(t);

    const token = createToken("student");
    const staffId = "64b000000000000000000003";

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
