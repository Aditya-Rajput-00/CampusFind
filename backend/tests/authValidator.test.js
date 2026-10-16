
const test = require("node:test");
const assert = require("node:assert/strict");
const { validationResult } = require("express-validator");

const {
    registerValidator,
    loginValidator,
} = require("../src/validators/authValidator");

const runValidators = async (validators, body) => {
    const req = {
        body: { ...body },
    };

    const res = {};
    let nextCalled = false;

    for (const validator of validators) {
        await validator.run(req);
    }

    const errors = validationResult(req);

    return {
        req,
        errors: errors.array(),
        isValid: errors.isEmpty(),
        res,
        nextCalled,
    };
};

test("registration validator accepts valid registration details", async () => {
    const result = await runValidators(registerValidator, {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        department: "Computer Science",
        phone: "1234567890",
    });

    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
});

test("registration validator rejects a missing name", async () => {
    const result = await runValidators(registerValidator, {
        email: "test@example.com",
        password: "password123",
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((error) => error.path === "name"));
});

test("registration validator rejects an invalid email", async () => {
    const result = await runValidators(registerValidator, {
        name: "Test User",
        email: "not-an-email",
        password: "password123",
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((error) => error.path === "email"));
});

test("registration validator rejects an empty password", async () => {
    const result = await runValidators(registerValidator, {
        name: "Test User",
        email: "test@example.com",
        password: "",
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((error) => error.path === "password"));
});

test("registration validator rejects an unsupported role", async () => {
    const result = await runValidators(registerValidator, {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "superadmin",
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((error) => error.path === "role"));
});

test("registration validator trims name and department and normalizes email", async () => {
    const result = await runValidators(registerValidator, {
        name: "  Test User  ",
        email: "TEST@EXAMPLE.COM",
        password: "password123",
        department: "  Computer Science  ",
    });

    assert.equal(result.isValid, true);
    assert.equal(result.req.body.name, "Test User");
    assert.equal(result.req.body.email, "test@example.com");
    assert.equal(result.req.body.department, "Computer Science");
});

test("login validator accepts valid credentials", async () => {
    const result = await runValidators(loginValidator, {
        email: "test@example.com",
        password: "password123",
    });

    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
});

test("login validator rejects an invalid email", async () => {
    const result = await runValidators(loginValidator, {
        email: "invalid-email",
        password: "password123",
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((error) => error.path === "email"));
});

test("login validator rejects a missing password", async () => {
    const result = await runValidators(loginValidator, {
        email: "test@example.com",
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((error) => error.path === "password"));
});
