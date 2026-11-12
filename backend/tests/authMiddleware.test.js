const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const protect = require("../src/middleware/authMiddleware");
const User = require("../src/models/User");

process.env.JWT_SECRET = "campusfind-test-secret-for-local-tests";

const TEST_USER_ID = "64b000000000000000000001";

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

function mockUserLookup(t, user, expectedId = TEST_USER_ID) {
    const originalFindById = User.findById;

    User.findById = async (id) => {
        assert.equal(id, expectedId);
        return user;
    };

    t.after(() => {
        User.findById = originalFindById;
    });
}

function createToken(payload = { userId: TEST_USER_ID, role: "student" }) {
    return jwt.sign(payload, process.env.JWT_SECRET);
}

function createRequest(token) {
    return {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };
}

test("rejects a request without an authorization header", async () => {
    const req = { headers: {} };
    const res = createResponse();
    let nextCalled = false;

    await protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Authentication required");
    assert.equal(nextCalled, false);
});

test("rejects an invalid JWT token", async () => {
    const req = createRequest("invalid-token");
    const res = createResponse();

    await protect(req, res, () => {
        assert.fail("next() should not be called");
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Invalid or expired token");
});

test("accepts a valid JWT and attaches current database user details", async (t) => {
    mockUserLookup(t, {
        _id: TEST_USER_ID,
        role: "student",
        accountStatus: "approved",
    });

    const req = createRequest(
        createToken({ userId: TEST_USER_ID, role: "admin" })
    );
    const res = createResponse();
    let nextCalled = false;

    await protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual(req.user, {
        userId: TEST_USER_ID,
        role: "student",
    });
});

test("rejects an expired JWT token", async () => {
    const token = jwt.sign(
        { userId: TEST_USER_ID, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: -1 }
    );

    const req = createRequest(token);
    const res = createResponse();

    await protect(req, res, () => {
        assert.fail("next() should not be called");
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Invalid or expired token");
});

test("rejects an authorization header without Bearer scheme", async () => {
    const req = {
        headers: {
            authorization: "Basic some-token",
        },
    };

    const res = createResponse();
    let nextCalled = false;

    await protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Authentication required");
});

test("rejects an empty Bearer token", async () => {
    const req = {
        headers: {
            authorization: "Bearer ",
        },
    };

    const res = createResponse();

    await protect(req, res, () => {
        assert.fail("next() should not be called");
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Invalid or expired token");
});

test("rejects a token with an invalid user ID", async () => {
    const req = createRequest(
        createToken({ userId: "invalid-id", role: "student" })
    );
    const res = createResponse();

    await protect(req, res, () => {
        assert.fail("next() should not be called");
    });

    assert.equal(res.statusCode, 401);
});

test("rejects a token when the user no longer exists", async (t) => {
    mockUserLookup(t, null);

    const req = createRequest(createToken());
    const res = createResponse();

    await protect(req, res, () => {
        assert.fail("next() should not be called");
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Invalid or expired token");
});

test("rejects a pending user account", async (t) => {
    mockUserLookup(t, {
        _id: TEST_USER_ID,
        role: "staff",
        accountStatus: "pending",
    });

    const req = createRequest(createToken());
    const res = createResponse();

    await protect(req, res, () => {
        assert.fail("next() should not be called");
    });

    assert.equal(res.statusCode, 401);
});

test("rejects a rejected user account", async (t) => {
    mockUserLookup(t, {
        _id: TEST_USER_ID,
        role: "staff",
        accountStatus: "rejected",
    });

    const req = createRequest(createToken());
    const res = createResponse();

    await protect(req, res, () => {
        assert.fail("next() should not be called");
    });

    assert.equal(res.statusCode, 401);
});

test("passes database errors to centralized error handling", async (t) => {
    const originalFindById = User.findById;
    const databaseError = new Error("Database unavailable");

    User.findById = async () => {
        throw databaseError;
    };

    t.after(() => {
        User.findById = originalFindById;
    });

    const req = createRequest(createToken());
    const res = createResponse();
    let receivedError = null;

    await protect(req, res, (error) => {
        receivedError = error;
    });

    assert.equal(receivedError, databaseError);
    assert.equal(res.statusCode, null);
});
