
const test = require("node:test");
const assert = require("node:assert/strict");

const authorize = require("../src/middleware/roleMiddleware");

const createResponse = () => ({
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
});

test("authorize allows a user with an allowed role", () => {
    const middleware = authorize("ADMIN", "STAFF");
    const req = { user: { userId: "user-1", role: "ADMIN" } };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
    assert.equal(res.body, null);
});

test("authorize denies a user with a role that is not allowed", () => {
    const middleware = authorize("ADMIN");
    const req = { user: { userId: "user-1", role: "STUDENT" } };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: "Access denied",
        errors: [],
    });
});

test("authorize denies a request when req.user is missing", () => {
    const middleware = authorize("ADMIN");
    const req = {};
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Access denied");
});

test("authorize denies a request when req.user is null", () => {
    const middleware = authorize("ADMIN");
    const req = { user: null };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Access denied");
});

test("authorize supports multiple allowed roles", () => {
    const middleware = authorize("ADMIN", "STAFF", "STUDENT");
    const req = { user: { userId: "user-2", role: "STUDENT" } };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
});

test("authorize denies a user when no roles are allowed", () => {
    const middleware = authorize();
    const req = { user: { userId: "user-1", role: "ADMIN" } };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Access denied");
});
