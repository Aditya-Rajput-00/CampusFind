
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

test("registration creates a student and hashes the password", async () => {
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
                role: "admin",
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
        assert.equal(savedUserData.role, "student");
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
        assert.equal("passwordHash" in user, false);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        assert.equal(decoded.userId, "test-user-123");
        assert.equal(decoded.role, "student");
    } finally {
        User.findOne = originalFindOne;
    }
});
