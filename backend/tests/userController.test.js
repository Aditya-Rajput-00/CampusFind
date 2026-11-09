
const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const User = require("../src/models/User");

const {
    getPendingStaff,
    approveStaff,
    rejectStaff,
} = require("../src/controllers/userController");

// Save original model methods so we can restore them after each test.
const originalFind = User.find;
const originalFindById = User.findById;

afterEach(() => {
    User.find = originalFind;
    User.findById = originalFindById;
});

// Mock Express response
const createResponse = () => {
    const res = {
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
    };

    return res;
};

// Mock next middleware
const createNext = () => {
    const next = (error) => {
        next.error = error;
    };

    next.error = null;
    return next;
};

// Sample staff user
const createStaffUser = (overrides = {}) => ({
    _id: "staff123",
    name: "Test Staff",
    email: "staff@example.com",
    role: "staff",
    accountStatus: "pending",
    department: "Computer Science",
    phone: "9876543210",
    passwordHash: "hashed-password",
    save: async function () {
        this.saved = true;
    },
    ...overrides,
});

// ==========================================
// GET PENDING STAFF TESTS
// ==========================================

test("getPendingStaff should return pending staff accounts", async () => {
    const users = [
        createStaffUser(),
        createStaffUser({
            _id: "staff456",
            email: "staff2@example.com",
        }),
    ];

    let receivedFilter;
    let receivedSelect;

    User.find = (filter) => {
        receivedFilter = filter;

        return {
            select: async (fields) => {
                receivedSelect = fields;
                return users;
            },
        };
    };

    const req = {};
    const res = createResponse();
    const next = createNext();

    await getPendingStaff(req, res, next);

    assert.deepEqual(receivedFilter, {
        role: "staff",
        accountStatus: "pending",
    });

    assert.equal(receivedSelect, "-passwordHash");
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 2);
    assert.equal(next.error, null);
});

test("getPendingStaff should forward database errors", async () => {
    const dbError = new Error("Database error");

    User.find = () => ({
        select: async () => {
            throw dbError;
        },
    });

    const req = {};
    const res = createResponse();
    const next = createNext();

    await getPendingStaff(req, res, next);

    assert.equal(next.error, dbError);
});

// ==========================================
// APPROVE STAFF TESTS
// ==========================================

test("approveStaff should approve a pending staff account", async () => {
    const user = createStaffUser();

    User.findById = async () => user;

    const req = {
        params: {
            id: "staff123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await approveStaff(req, res, next);

    assert.equal(user.accountStatus, "approved");
    assert.equal(user.saved, true);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(
        res.body.message,
        "Staff account approved successfully"
    );

    assert.equal(res.body.data.user.id, "staff123");
    assert.equal(res.body.data.user.accountStatus, "approved");
    assert.equal(res.body.data.user.role, "staff");

    assert.equal(
        Object.hasOwn(res.body.data.user, "passwordHash"),
        false
    );

    assert.equal(next.error, null);
});

test("approveStaff should return 404 if user does not exist", async () => {
    User.findById = async () => null;

    const req = {
        params: {
            id: "unknown123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await approveStaff(req, res, next);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "User not found");
});

test("approveStaff should reject non-staff accounts", async () => {
    const user = createStaffUser({
        role: "student",
    });

    User.findById = async () => user;

    const req = {
        params: {
            id: "student123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await approveStaff(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        "Only staff accounts can be approved"
    );

    assert.equal(user.saved, undefined);
});

test("approveStaff should reject accounts that are not pending", async () => {
    const user = createStaffUser({
        accountStatus: "approved",
    });

    User.findById = async () => user;

    const req = {
        params: {
            id: "staff123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await approveStaff(req, res, next);

    assert.equal(res.statusCode, 409);
    assert.equal(
        res.body.message,
        "This staff account is not pending approval"
    );

    assert.equal(user.saved, undefined);
});

test("approveStaff should forward database errors", async () => {
    const dbError = new Error("Database error");

    User.findById = async () => {
        throw dbError;
    };

    const req = {
        params: {
            id: "staff123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await approveStaff(req, res, next);

    assert.equal(next.error, dbError);
});

// ==========================================
// REJECT STAFF TESTS
// ==========================================

test("rejectStaff should reject a pending staff account", async () => {
    const user = createStaffUser();

    User.findById = async () => user;

    const req = {
        params: {
            id: "staff123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await rejectStaff(req, res, next);

    assert.equal(user.accountStatus, "rejected");
    assert.equal(user.saved, true);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(
        res.body.message,
        "Staff account rejected successfully"
    );

    assert.equal(res.body.data.user.id, "staff123");
    assert.equal(res.body.data.user.accountStatus, "rejected");
    assert.equal(res.body.data.user.role, "staff");

    assert.equal(
        Object.hasOwn(res.body.data.user, "passwordHash"),
        false
    );

    assert.equal(next.error, null);
});

test("rejectStaff should return 404 if user does not exist", async () => {
    User.findById = async () => null;

    const req = {
        params: {
            id: "unknown123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await rejectStaff(req, res, next);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "User not found");
});

test("rejectStaff should reject non-staff accounts", async () => {
    const user = createStaffUser({
        role: "student",
    });

    User.findById = async () => user;

    const req = {
        params: {
            id: "student123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await rejectStaff(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        "Only staff accounts can be rejected"
    );

    assert.equal(user.saved, undefined);
});

test("rejectStaff should reject accounts that are not pending", async () => {
    const user = createStaffUser({
        accountStatus: "rejected",
    });

    User.findById = async () => user;

    const req = {
        params: {
            id: "staff123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await rejectStaff(req, res, next);

    assert.equal(res.statusCode, 409);
    assert.equal(
        res.body.message,
        "This staff account is not pending approval"
    );

    assert.equal(user.saved, undefined);
});

test("rejectStaff should forward database errors", async () => {
    const dbError = new Error("Database error");

    User.findById = async () => {
        throw dbError;
    };

    const req = {
        params: {
            id: "staff123",
        },
    };

    const res = createResponse();
    const next = createNext();

    await rejectStaff(req, res, next);

    assert.equal(next.error, dbError);
});
