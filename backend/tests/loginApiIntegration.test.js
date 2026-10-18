
const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const app = require("../src/app");
const User = require("../src/models/User");

async function makeRequest(path, body) {
    const server = app.listen(0);

    try {
        const address = server.address();

        return await fetch(
            `http://127.0.0.1:${address.port}${path}`,
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

test("POST /api/auth/login returns 401 for an unknown email", async (t) => {
    t.mock.method(User, "findOne", async () => null);

    const response = await makeRequest("/api/auth/login", {
        email: "unknown@example.com",
        password: "ExamplePassword123"
    });

    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid email or password");
    assert.deepEqual(body.errors, []);
});

test("POST /api/auth/login returns 401 for an incorrect password", async (t) => {
    const hashedPassword = await bcrypt.hash("CorrectPassword123", 10);

    const mockUser = {
        _id: "test-user-id",
        name: "Test User",
        email: "student@example.com",
        passwordHash: hashedPassword,
        role: "student"
    };

    t.mock.method(User, "findOne", async () => mockUser);

    const response = await makeRequest("/api/auth/login", {
        email: "student@example.com",
        password: "WrongPassword123"
    });

    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid email or password");
    assert.deepEqual(body.errors, []);
});
