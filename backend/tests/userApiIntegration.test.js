
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");

const TEST_SECRET = "campusfind-test-secret";

const TEST_USER_IDS = {
    student: "64b000000000000000000001",
    admin: "64b000000000000000000002",
    staff: "64b000000000000000000006",
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

test("GET /api/users rejects requests without authentication", async () => {
    const response = await makeRequest("/api/users");
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

test("GET /api/users denies an authenticated staff member", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "staff");

    const token = createToken("staff");
    const response = await makeRequest("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.message, "Access denied");
});

test("GET /api/users returns safe filtered records with pagination for an admin", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");

    const originalFind = User.find;
    const originalCountDocuments = User.countDocuments;
    const safeUsers = [{
        name: "Sam Student",
        email: "sam@example.com",
        role: "staff",
        accountStatus: "pending",
        department: "Library Services",
        createdAt: "2026-10-01T00:00:00.000Z",
    }];
    let capturedFilter;

    User.find = (filter) => {
        capturedFilter = filter;
        const query = {
            select: (fields) => {
                assert.equal(
                    fields,
                    "name email role accountStatus department createdAt -_id"
                );
                return query;
            },
            sort: (sort) => {
                assert.deepEqual(sort, { createdAt: -1, _id: -1 });
                return query;
            },
            skip: (skip) => {
                assert.equal(skip, 10);
                return query;
            },
            limit: (limit) => {
                assert.equal(limit, 10);
                return query;
            },
            lean: async () => safeUsers,
        };
        return query;
    };
    User.countDocuments = async (filter) => {
        assert.deepEqual(filter, capturedFilter);
        return 23;
    };

    t.after(() => {
        User.find = originalFind;
        User.countDocuments = originalCountDocuments;
    });

    const token = createToken("admin");
    const response = await makeRequest(
        "/api/users?search=Sam&role=staff&accountStatus=pending&page=2&limit=10",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(capturedFilter, {
        $or: [{ name: /Sam/i }, { email: /Sam/i }],
        role: "staff",
        accountStatus: "pending",
    });
    assert.deepEqual(body.data, safeUsers);
    assert.deepEqual(body.pagination, {
        page: 2,
        limit: 10,
        totalRecords: 23,
        totalPages: 3,
    });
    assert.equal(JSON.stringify(body).includes("passwordHash"), false);
    assert.equal(JSON.stringify(body).includes("phone"), false);
});

test("GET /api/users rejects invalid filters and excessive pagination", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");

    const token = createToken("admin");
    const response = await makeRequest(
        "/api/users?page=0&limit=101&role=owner&accountStatus=locked",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(
        body.errors.map(({ path }) => path).sort(),
        ["accountStatus", "limit", "page", "role"]
    );
});

test("GET /api/users identifies empty role and accountStatus filters as invalid", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");

    const token = createToken("admin");
    const response = await makeRequest("/api/users?role=&accountStatus=", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(
        body.errors.map(({ path }) => path).sort(),
        ["accountStatus", "role"]
    );
    assert.ok(body.errors.every(({ msg }) => msg.includes("unsupported value")));
});

test("GET /api/users bounds search length and calculated page offset", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");

    const token = createToken("admin");
    const query = new URLSearchParams({
        search: "x".repeat(101),
        page: "10002",
        limit: "100",
    });
    const response = await makeRequest(`/api/users?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body.errors.map(({ path }) => path).sort(), ["page", "search"]);
});

test("GET /api/users/staff returns safe, searched and paginated staff for admins", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");

    const originalFind = User.find;
    const originalCountDocuments = User.countDocuments;
    const records = [{
        _id: "64b000000000000000000003",
        name: "Sam Staff",
        email: "sam@example.com",
        role: "staff",
        accountStatus: "pending",
        department: "Library Services",
        phone: "555-0100",
        createdAt: "2026-10-01T00:00:00.000Z",
    }];
    let capturedFilter;

    User.find = (filter) => {
        capturedFilter = filter;
        const query = {
            select: (fields) => {
                assert.equal(fields, "_id name email role accountStatus department phone createdAt");
                return query;
            },
            sort: (sort) => {
                assert.deepEqual(sort, { createdAt: -1, _id: -1 });
                return query;
            },
            skip: (skip) => {
                assert.equal(skip, 5);
                return query;
            },
            limit: (limit) => {
                assert.equal(limit, 5);
                return query;
            },
            lean: async () => records,
        };
        return query;
    };
    User.countDocuments = async (filter) => {
        assert.deepEqual(filter, capturedFilter);
        return 12;
    };
    t.after(() => {
        User.find = originalFind;
        User.countDocuments = originalCountDocuments;
    });

    const token = createToken("admin");
    const response = await makeRequest(
        "/api/users/staff?search=Sam&accountStatus=pending&page=2&limit=5",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(capturedFilter, {
        role: "staff",
        $or: [{ name: /Sam/i }, { email: /Sam/i }],
        accountStatus: "pending",
    });
    assert.deepEqual(body.data, records);
    assert.deepEqual(body.pagination, {
        page: 2,
        limit: 5,
        totalRecords: 12,
        totalPages: 3,
    });
    assert.equal(JSON.stringify(body).includes("passwordHash"), false);
    assert.equal(JSON.stringify(body).includes("token"), false);
});

test("GET /api/users/staff denies non-admin users", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "staff");
    const token = createToken("staff");
    const response = await makeRequest("/api/users/staff", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.message, "Access denied");
});

test("GET /api/users/staff includes legacy accounts in approved results", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");
    const originalFind = User.find;
    const originalCountDocuments = User.countDocuments;
    const legacyStaff = {
        _id: "64b000000000000000000007",
        name: "Legacy Staff",
        email: "legacy@example.com",
        role: "staff",
    };
    User.find = (filter) => {
        assert.deepEqual(filter, {
            role: "staff",
            $and: [
                { $or: [{ name: /Legacy/i }, { email: /Legacy/i }] },
                { $or: [{ accountStatus: "approved" }, { accountStatus: null }] },
            ],
        });
        const query = {
            select: () => query,
            sort: () => query,
            skip: () => query,
            limit: () => query,
            lean: async () => [legacyStaff],
        };
        return query;
    };
    User.countDocuments = async () => 1;
    t.after(() => {
        User.find = originalFind;
        User.countDocuments = originalCountDocuments;
    });

    const token = createToken("admin");
    const response = await makeRequest(
        "/api/users/staff?search=Legacy&accountStatus=approved",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.pagination.totalRecords, 1);
    assert.equal(body.data[0].accountStatus, "approved");
});

test("GET /api/users/staff rejects unsupported filters and pagination", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");
    const token = createToken("admin");
    const response = await makeRequest(
        "/api/users/staff?accountStatus=locked&page=0&limit=101&role=student",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(body.errors.map(({ path }) => path).sort(), [
        "accountStatus", "limit", "page", "role",
    ]);
});

test("GET /api/users counts legacy accounts without a status as approved", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");
    const originalFind = User.find;
    const originalCountDocuments = User.countDocuments;
    const legacyUser = { name: "Legacy Staff", email: "legacy@example.com" };
    User.find = (filter) => {
        assert.deepEqual(filter, {
            role: "staff",
            $or: [{ accountStatus: "approved" }, { accountStatus: null }],
        });
        const query = {
            select: () => query,
            sort: () => query,
            skip: () => query,
            limit: () => query,
            lean: async () => [legacyUser],
        };
        return query;
    };
    User.countDocuments = async () => 1;
    t.after(() => {
        User.find = originalFind;
        User.countDocuments = originalCountDocuments;
    });

    const token = createToken("admin");
    const response = await makeRequest(
        "/api/users?role=staff&accountStatus=approved&limit=1",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.pagination.totalRecords, 1);
    assert.equal(body.data[0].accountStatus, "approved");
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
