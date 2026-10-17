
const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");

test("GET / returns the backend health-check message", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();
        const response = await fetch(`http://127.0.0.1:${address.port}/`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(body, {
            message: "CampusFind backend is running",
        });
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

test("GET to an unknown route returns a 404 response", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();
        const response = await fetch(
            `http://127.0.0.1:${address.port}/this-route-does-not-exist`
        );
        const body = await response.json();

        assert.equal(response.status, 404);
        assert.deepEqual(body, {
            success: false,
            message: "Route not found",
            errors: [],
        });
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
