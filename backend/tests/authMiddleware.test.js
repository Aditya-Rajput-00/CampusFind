
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const protect = require("../src/middleware/authMiddleware");

process.env.JWT_SECRET = "campusfind-test-secret-for-local-tests";

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

test("rejects a request without an authorization header", () => {
    const req = { headers: {} };
    const res = createResponse();

    let nextCalled = false;

    protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Authentication required");
    assert.equal(nextCalled, false);
});

test("rejects an invalid JWT token", () => {
    const req = {
        headers: {
            authorization: "Bearer invalid-token",
        },
    };

    const res = createResponse();

    protect(req, res, () => {
        assert.fail("next() should not be called for an invalid token");
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid or expired token");
});

test("accepts a valid JWT and attaches its payload to the request", () => {
    const payload = {
        userId: "test-user-123",
        role: "student",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    const req = {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };

    const res = createResponse();

    let nextCalled = false;

    protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.userId, payload.userId);
    assert.equal(req.user.role, payload.role);
});

test("rejects an expired JWT token", () => {
    const token = jwt.sign(
        {
            userId: "test-user-123",
            role: "student",
        },
        process.env.JWT_SECRET,
        {
            expiresIn: -1,
        }
    );

    const req = {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };

    const res = createResponse();

    protect(req, res, () => {
        assert.fail("next() should not be called for an expired token");
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Invalid or expired token");
});
