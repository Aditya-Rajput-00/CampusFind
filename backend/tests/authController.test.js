
const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../src/models/User");
const { register, login } = require("../src/controllers/authController");

process.env.JWT_SECRET = "campusfind-test-secret-for-local-tests";
process.env.JWT_EXPIRES_IN = "1h";

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

const createNext = () => {
    const state = {
        called: false,
        error: null,
    };

    const next = (error) => {
        state.called = true;
        state.error = error || null;
    };

    return { next, state };
};

test("registration rejects missing required fields", async () => {
    const req = { body: { name: "Test User" } };
    const res = createResponse();
    const { next, state } = createNext();

    await register(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Name, email, and password are required");
    assert.equal(state.called, false);
});

test("registration rejects an existing user", async () => {
    const originalFindOne = User.findOne;

    try {
        User.findOne = async () => ({ _id: "existing-user" });

        const req = {
            body: {
                name: "Test User",
                email: "existing@example.com",
                password: "test-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await register(req, res, next);

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.success, false);
        assert.equal(res.body.message, "User already exists");
        assert.equal(state.called, false);
    } finally {
        User.findOne = originalFindOne;
    }
});

test("registration creates an approved student and hashes the password", async () => {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;

    try {
        User.findOne = async () => null;

        let savedUserData;

        User.create = async (userData) => {
            savedUserData = userData;

            return {
                _id: "new-user-123",
                ...userData,
            };
        };

        const req = {
            body: {
                name: "Test User",
                email: "test@example.com",
                password: "plain-password",
                role: "student",
                department: "Computer Science",
                phone: "1234567890",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await register(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.user.role, "student");
        assert.equal(res.body.data.user.accountStatus, "approved");
        assert.equal(savedUserData.role, "student");
        assert.equal(savedUserData.accountStatus, "approved");
        assert.notEqual(savedUserData.passwordHash, "plain-password");

        assert.equal(
            await bcrypt.compare("plain-password", savedUserData.passwordHash),
            true
        );

        assert.equal(res.body.data.user.id, "new-user-123");
        assert.equal("passwordHash" in res.body.data.user, false);
    } finally {
        User.findOne = originalFindOne;
        User.create = originalCreate;
    }
});

test("registration creates a pending staff account", async () => {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;

    try {
        User.findOne = async () => null;

        let savedUserData;

        User.create = async (userData) => {
            savedUserData = userData;

            return {
                _id: "new-staff-123",
                ...userData,
            };
        };

        const req = {
            body: {
                name: "Staff User",
                email: "staff@example.com",
                password: "staff-password",
                role: "staff",
                department: "Administration",
                phone: "1234567890",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await register(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.user.role, "staff");
        assert.equal(res.body.data.user.accountStatus, "pending");
        assert.equal(savedUserData.role, "staff");
        assert.equal(savedUserData.accountStatus, "pending");
        assert.equal("passwordHash" in res.body.data.user, false);
    } finally {
        User.findOne = originalFindOne;
        User.create = originalCreate;
    }
});

test("registration rejects direct admin account creation", async () => {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;

    try {
        let createCalled = false;

        User.findOne = async () => null;

        User.create = async () => {
            createCalled = true;
        };

        const req = {
            body: {
                name: "Admin User",
                email: "admin@example.com",
                password: "admin-password",
                role: "admin",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await register(req, res, next);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.success, false);
        assert.equal(createCalled, false);
        assert.equal(state.called, false);
    } finally {
        User.findOne = originalFindOne;
        User.create = originalCreate;
    }
});

test("login rejects missing credentials", async () => {
    const req = { body: { email: "test@example.com" } };
    const res = createResponse();
    const { next, state } = createNext();

    await login(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Email and password are required");
    assert.equal(state.called, false);
});

test("login rejects an unknown email", async () => {
    const originalFindOne = User.findOne;

    try {
        User.findOne = async () => null;

        const req = {
            body: {
                email: "unknown@example.com",
                password: "test-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await login(req, res, next);

        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, "Invalid email or password");
        assert.equal(state.called, false);
    } finally {
        User.findOne = originalFindOne;
    }
});

test("login rejects an incorrect password", async () => {
    const originalFindOne = User.findOne;

    try {
        const passwordHash = await bcrypt.hash("correct-password", 4);

        User.findOne = async () => ({
            _id: "test-user-123",
            passwordHash,
        });

        const req = {
            body: {
                email: "test@example.com",
                password: "wrong-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await login(req, res, next);

        assert.equal(res.statusCode, 401);
        assert.equal(res.body.message, "Invalid email or password");
        assert.equal(state.called, false);
    } finally {
        User.findOne = originalFindOne;
    }
});

test("login blocks a staff account awaiting approval", async () => {
    const originalFindOne = User.findOne;

    try {
        const passwordHash = await bcrypt.hash("correct-password", 4);

        User.findOne = async () => ({
            _id: "pending-staff-123",
            name: "Staff User",
            email: "staff@example.com",
            passwordHash,
            role: "staff",
            accountStatus: "pending",
        });

        const req = {
            body: {
                email: "staff@example.com",
                password: "correct-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await login(req, res, next);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
        assert.equal(
            res.body.message,
            "Your staff account is awaiting admin approval"
        );
        assert.equal(state.called, false);
        assert.equal(res.body.data, undefined);
    } finally {
        User.findOne = originalFindOne;
    }
});

test("login blocks a rejected account", async () => {
    const originalFindOne = User.findOne;

    try {
        const passwordHash = await bcrypt.hash("correct-password", 4);

        User.findOne = async () => ({
            _id: "rejected-staff-123",
            name: "Staff User",
            email: "rejected@example.com",
            passwordHash,
            role: "staff",
            accountStatus: "rejected",
        });

        const req = {
            body: {
                email: "rejected@example.com",
                password: "correct-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await login(req, res, next);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
        assert.equal(
            res.body.message,
            "Your account registration was rejected. Please contact the administrator."
        );
        assert.equal(state.called, false);
        assert.equal(res.body.data, undefined);
    } finally {
        User.findOne = originalFindOne;
    }
});

test("login returns a JWT for valid credentials", async () => {
    const originalFindOne = User.findOne;

    try {
        const passwordHash = await bcrypt.hash("correct-password", 4);

        User.findOne = async () => ({
            _id: "test-user-123",
            name: "Test User",
            email: "test@example.com",
            passwordHash,
            role: "student",
            department: "Computer Science",
            phone: "1234567890",
            accountStatus: "approved",
        });

        const req = {
            body: {
                email: "test@example.com",
                password: "correct-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await login(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.message, "Login successful");

        const { token, user } = res.body.data;

        assert.ok(token);
        assert.equal(user.id, "test-user-123");
        assert.equal(user.email, "test@example.com");
        assert.equal(user.role, "student");
        assert.equal(user.accountStatus, "approved");
        assert.equal("passwordHash" in user, false);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        assert.equal(decoded.userId, "test-user-123");
        assert.equal(decoded.role, "student");
    } finally {
        User.findOne = originalFindOne;
    }
});

test("login allows an existing account without accountStatus", async () => {
    const originalFindOne = User.findOne;

    try {
        const passwordHash = await bcrypt.hash("correct-password", 4);

        User.findOne = async () => ({
            _id: "legacy-user-123",
            name: "Legacy User",
            email: "legacy@example.com",
            passwordHash,
            role: "student",
        });

        const req = {
            body: {
                email: "legacy@example.com",
                password: "correct-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await login(req, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.user.accountStatus, "approved");
        assert.ok(res.body.data.token);
    } finally {
        User.findOne = originalFindOne;
    }
});

test("registration forwards database errors to next", async () => {
    const originalFindOne = User.findOne;
    const databaseError = new Error("Database error");

    try {
        User.findOne = async () => {
            throw databaseError;
        };

        const req = {
            body: {
                name: "Test User",
                email: "test@example.com",
                password: "test-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await register(req, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, databaseError);
        assert.equal(res.statusCode, null);
    } finally {
        User.findOne = originalFindOne;
    }
});

test("login forwards database errors to next", async () => {
    const originalFindOne = User.findOne;
    const databaseError = new Error("Database error");

    try {
        User.findOne = async () => {
            throw databaseError;
        };

        const req = {
            body: {
                email: "test@example.com",
                password: "test-password",
            },
        };

        const res = createResponse();
        const { next, state } = createNext();

        await login(req, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, databaseError);
        assert.equal(res.statusCode, null);
    } finally {
        User.findOne = originalFindOne;
    }
});
