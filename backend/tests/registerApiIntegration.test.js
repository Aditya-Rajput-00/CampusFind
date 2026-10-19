
const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const User = require("../src/models/User");

async function makeRequest(body) {
    const server = app.listen(0);

    try {
        const address = server.address();

        return await fetch(
            `http://127.0.0.1:${address.port}/api/auth/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }
        );
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}

test("POST /api/auth/register creates a student account successfully", async (t) => {
    const createdUser = {
        _id: "test-user-id",
        name: "Test Student",
        email: "newstudent@example.com",
        role: "student",
        department: "Computer Science",
        phone: "9999999999"
    };

    t.mock.method(User, "findOne", async () => null);

    t.mock.method(User, "create", async (userData) => {
        assert.equal(userData.name, "Test Student");
        assert.equal(userData.email, "newstudent@example.com");
        assert.equal(userData.role, "student");
        assert.ok(userData.passwordHash);
        assert.notEqual(userData.passwordHash, "ExamplePassword123");

        return createdUser;
    });

    const response = await makeRequest({
        name: "Test Student",
        email: "newstudent@example.com",
        password: "ExamplePassword123",
        department: "Computer Science",
        phone: "9999999999"
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.message, "User registered successfully");
    assert.equal(body.data.user.id, "test-user-id");
    assert.equal(body.data.user.email, "newstudent@example.com");
    assert.equal(body.data.user.role, "student");
    assert.equal(body.data.user.passwordHash, undefined);
    assert.equal(body.data.user.password, undefined);
});

test("POST /api/auth/register returns 409 for an existing email", async (t) => {
    const existingUser = {
        _id: "existing-user-id",
        name: "Existing Student",
        email: "existing@example.com",
        role: "student"
    };

    t.mock.method(User, "findOne", async () => existingUser);

    const response = await makeRequest({
        name: "Another Student",
        email: "existing@example.com",
        password: "ExamplePassword123"
    });

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(body.success, false);
    assert.equal(body.message, "User already exists");
    assert.deepEqual(body.errors, []);
});

test("POST /api/auth/register rejects an unsupported role", async () => {
    const response = await makeRequest({
        name: "Test Admin",
        email: "testadmin@example.com",
        password: "ExamplePassword123",
        role: "admin"
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.some((error) => error.path === "role"));
});
