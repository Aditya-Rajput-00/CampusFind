
const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const User = require("../src/models/User");

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

    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: "Test Student",
                    email: "newstudent@example.com",
                    password: "ExamplePassword123",
                    department: "Computer Science",
                    phone: "9999999999"
                })
            }
        );

        const body = await response.json();

        assert.equal(response.status, 201);
        assert.equal(body.success, true);
        assert.equal(body.message, "User registered successfully");

        assert.equal(body.data.user.id, "test-user-id");
        assert.equal(body.data.user.name, "Test Student");
        assert.equal(body.data.user.email, "newstudent@example.com");
        assert.equal(body.data.user.role, "student");

        assert.equal(body.data.user.passwordHash, undefined);
        assert.equal(body.data.user.password, undefined);
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
});
