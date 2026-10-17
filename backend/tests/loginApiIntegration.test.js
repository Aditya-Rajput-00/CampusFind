
const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const User = require("../src/models/User");

test("POST /api/auth/login returns 401 for an unknown email", async (t) => {
    t.mock.method(User, "findOne", async () => null);

    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: "unknown@example.com",
                    password: "ExamplePassword123"
                })
            }
        );

        const body = await response.json();

        assert.equal(response.status, 401);
        assert.equal(body.success, false);
        assert.equal(body.message, "Invalid email or password");
        assert.deepEqual(body.errors, []);
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
