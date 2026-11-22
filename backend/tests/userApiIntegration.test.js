
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");
const Item = require("../src/models/Item");
const Claim = require("../src/models/Claim");
const Match = require("../src/models/Match");
const Notification = require("../src/models/Notification");

const TEST_SECRET = "campusfind-test-secret";

const TEST_USER_IDS = {
    student: "64b000000000000000000001",
    admin: "64b000000000000000000002",
    staff: "64b000000000000000000006",
};

const DELETE_STUDENT_ID = "64b000000000000000000011";
const DELETE_STAFF_ID = "64b000000000000000000012";

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

function makeDeletableUser(id, role) {
    return {
        _id: { toString: () => id },
        name: `Test ${role}`,
        email: `${role}@example.com`,
        passwordHash: "existing-password-hash",
        role,
        accountStatus: "approved",
        department: "Campus Services",
        phone: "555-0100",
        save: async function save() { this.saved = true; },
    };
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

test("GET /api/users/students requires authentication", async () => {
    const response = await makeRequest("/api/users/students");
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.message, "Authentication required");
});

test("GET /api/users/students returns a safe searched and paginated directory to staff", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "staff");

    const originalFind = User.find;
    const originalCountDocuments = User.countDocuments;
    const students = [{ name: "Asha Student", email: "asha@example.com", department: "Science" }];
    let capturedFilter;
    User.find = (filter) => {
        capturedFilter = filter;
        const query = {
            select: (fields) => {
                assert.equal(fields, "name email department -_id");
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
            lean: async () => students,
        };
        return query;
    };
    User.countDocuments = async (filter) => {
        assert.deepEqual(filter, capturedFilter);
        return 21;
    };
    t.after(() => {
        User.find = originalFind;
        User.countDocuments = originalCountDocuments;
    });

    const token = createToken("staff");
    const response = await makeRequest("/api/users/students?search=asha&page=2&limit=10", {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(capturedFilter, {
        role: "student",
        deletedAt: null,
        $and: [
            { $or: [{ name: /asha/i }, { email: /asha/i }] },
            { $or: [{ accountStatus: "approved" }, { accountStatus: null }] },
        ],
    });
    assert.deepEqual(body.data, students);
    assert.deepEqual(body.pagination, { page: 2, limit: 10, totalRecords: 21, totalPages: 3 });
    assert.equal(JSON.stringify(body).includes("passwordHash"), false);
    assert.equal(JSON.stringify(body).includes("accountStatus"), false);
    assert.equal(JSON.stringify(body).includes("phone"), false);
});

test("GET /api/users/students denies students", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "student");
    const token = createToken("student");
    const deniedResponse = await makeRequest("/api/users/students", {
        headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(deniedResponse.status, 403);
});

test("GET /api/users/students rejects unsupported filters and pagination for staff", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "staff");
    const staffToken = createToken("staff");
    const invalidResponse = await makeRequest("/api/users/students?role=admin&page=0", {
        headers: { Authorization: `Bearer ${staffToken}` },
    });
    const body = await invalidResponse.json();
    assert.equal(invalidResponse.status, 400);
    assert.deepEqual(body.errors.map(({ path }) => path).sort(), ["page", "role"]);
});

test("DELETE /api/users/:id requires authentication", async () => {
    const response = await makeRequest(`/api/users/${DELETE_STUDENT_ID}`, { method: "DELETE" });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.message, "Authentication required");
});

test("DELETE /api/users/:id lets admins anonymize a student and preserves related history", async (t) => {
    restoreEnvironment(t);
    const student = makeDeletableUser(DELETE_STUDENT_ID, "student");
    mockAuthenticatedUser(t, "admin", { [DELETE_STUDENT_ID]: student });

    const relatedHistory = {
        items: [{ _id: "item1", reportedBy: DELETE_STUDENT_ID }],
        claims: [{ _id: "claim1", claimantId: DELETE_STUDENT_ID, verification: { verifiedBy: DELETE_STUDENT_ID } }],
        matches: [{ _id: "match1", lostItemId: "item1", foundItemId: "item2" }],
        notifications: [{ _id: "notice1", userId: DELETE_STUDENT_ID }],
    };
    const originalDeleteMethods = [Item, Claim, Match, Notification].map((Model) => Model.deleteMany);
    const cascadeCalls = [];
    [Item, Claim, Match, Notification].forEach((Model) => {
        Model.deleteMany = async () => cascadeCalls.push(Model.modelName);
    });
    t.after(() => {
        [Item, Claim, Match, Notification].forEach((Model, index) => {
            Model.deleteMany = originalDeleteMethods[index];
        });
    });

    const token = createToken("admin");
    const response = await makeRequest(`/api/users/${DELETE_STUDENT_ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, "Account deleted successfully");
    assert.equal(student.name, "Deleted account");
    assert.equal(student.email, `deleted-${DELETE_STUDENT_ID}@deleted.invalid`);
    assert.notEqual(student.passwordHash, "existing-password-hash");
    assert.equal(student.accountStatus, "rejected");
    assert.equal(student.department, undefined);
    assert.equal(student.phone, undefined);
    assert.ok(student.deletedAt instanceof Date);
    assert.equal(student.saved, true);
    assert.equal(relatedHistory.items[0].reportedBy, DELETE_STUDENT_ID);
    assert.equal(relatedHistory.claims[0].claimantId, DELETE_STUDENT_ID);
    assert.equal(relatedHistory.claims[0].verification.verifiedBy, DELETE_STUDENT_ID);
    assert.equal(relatedHistory.matches[0].lostItemId, "item1");
    assert.equal(relatedHistory.notifications[0].userId, DELETE_STUDENT_ID);
    assert.deepEqual(cascadeCalls, []);
});

test("DELETE /api/users/:id lets admins anonymize a staff account", async (t) => {
    restoreEnvironment(t);
    const staff = makeDeletableUser(DELETE_STAFF_ID, "staff");
    mockAuthenticatedUser(t, "admin", { [DELETE_STAFF_ID]: staff });
    const token = createToken("admin");

    const response = await makeRequest(`/api/users/${DELETE_STAFF_ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    assert.ok(staff.deletedAt instanceof Date);
    assert.equal(staff.role, "staff");
});

test("DELETE /api/users/:id rejects staff callers", async (t) => {
    restoreEnvironment(t);
    const target = makeDeletableUser(DELETE_STUDENT_ID, "student");
    mockAuthenticatedUser(t, "staff", { [DELETE_STUDENT_ID]: target });
    const token = createToken("staff");
    const response = await makeRequest(`/api/users/${DELETE_STUDENT_ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.message, "Access denied");
});

test("DELETE /api/users/:id rejects student callers", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "student", { [DELETE_STUDENT_ID]: makeDeletableUser(DELETE_STUDENT_ID, "student") });
    const token = createToken("student");
    const response = await makeRequest(`/api/users/${DELETE_STUDENT_ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 403);
});

test("DELETE /api/users/:id rejects invalid IDs before lookup", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin");
    const token = createToken("admin");
    const response = await makeRequest("/api/users/not-an-object-id", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Validation failed");
    assert.equal(body.errors[0].path, "id");
});

test("DELETE /api/users/:id blocks self-deletion and protected administrator accounts", async (t) => {
    restoreEnvironment(t);
    mockAuthenticatedUser(t, "admin", {
        [TEST_USER_IDS.admin]: { _id: TEST_USER_IDS.admin, role: "admin" },
        [DELETE_STAFF_ID]: { _id: DELETE_STAFF_ID, role: "admin" },
    });
    const token = createToken("admin");

    const selfResponse = await makeRequest(`/api/users/${TEST_USER_IDS.admin}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(selfResponse.status, 409);
    assert.equal((await selfResponse.json()).message, "Administrators cannot delete their own account");

    const protectedResponse = await makeRequest(`/api/users/${DELETE_STAFF_ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(protectedResponse.status, 409);
    assert.equal((await protectedResponse.json()).message, "Administrator accounts are protected");
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
                    "_id name email role accountStatus department createdAt"
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
        deletedAt: null,
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
        deletedAt: null,
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
            deletedAt: null,
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
            deletedAt: null,
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
            deletedAt: null,
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
