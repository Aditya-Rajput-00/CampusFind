
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

test("POST /api/auth/register rejects an invalid email", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "Test Student",
                    email: "not-an-email",
                    password: "ExamplePassword123",
                }),
            }
        );

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Validation failed");
        assert.ok(Array.isArray(body.errors));
        assert.ok(
            body.errors.some((error) => error.path === "email")
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
});

test("POST /api/auth/register rejects missing required fields", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            }
        );

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Validation failed");
        assert.ok(Array.isArray(body.errors));
        assert.ok(body.errors.length > 0);
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

test("POST /api/auth/login rejects an invalid email", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "not-an-email",
                    password: "ExamplePassword123",
                }),
            }
        );

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Validation failed");
        assert.ok(Array.isArray(body.errors));
        assert.ok(
            body.errors.some((error) => error.path === "email")
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
});

test("POST /api/auth/login rejects missing credentials", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            }
        );

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Validation failed");
        assert.ok(body.errors.length > 0);
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

test("POST /api/auth/login rejects a missing password", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "student@example.com",
                }),
            }
        );

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Validation failed");
        assert.ok(Array.isArray(body.errors));
        assert.ok(
            body.errors.some((error) => error.path === "password")
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
});

test("POST /api/auth/login rejects a missing email", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: "ExamplePassword123",
                }),
            }
        );

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Validation failed");
        assert.ok(Array.isArray(body.errors));
        assert.ok(
            body.errors.some((error) => error.path === "email")
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
});

// CORS integration tests

test("CORS allows requests from the configured frontend origin", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(`http://127.0.0.1:${address.port}/`, {
            headers: {
                Origin: "http://localhost:5173",
            },
        });

        assert.equal(response.status, 200);
        assert.equal(
            response.headers.get("access-control-allow-origin"),
            "http://localhost:5173"
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
});

test("CORS does not allow requests from an untrusted origin", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(`http://127.0.0.1:${address.port}/`, {
            headers: {
                Origin: "https://untrusted-example.com",
            },
        });

        assert.equal(response.status, 200);

        assert.notEqual(
            response.headers.get("access-control-allow-origin"),
            "https://untrusted-example.com"
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
});

test("CORS handles preflight OPTIONS requests from the configured frontend", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/auth/login`,
            {
                method: "OPTIONS",
                headers: {
                    Origin: "http://localhost:5173",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "content-type,authorization",
                },
            }
        );

        assert.equal(response.status, 204);
        assert.equal(
            response.headers.get("access-control-allow-origin"),
            "http://localhost:5173"
        );

        assert.ok(
            response.headers.get("access-control-allow-methods")
                .includes("POST")
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
});
