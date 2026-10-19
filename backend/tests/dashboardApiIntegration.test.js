
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");

async function makeRequest(token) {
    const server = app.listen(0);

    try {
        const address = server.address();

        return await fetch(
            `http://127.0.0.1:${address.port}/api/dashboard/stats`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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

test("GET /api/dashboard/stats rejects requests without authentication", async () => {
    const server = app.listen(0);

    try {
        const address = server.address();
        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/dashboard/stats`
        );
        const body = await response.json();

        assert.equal(response.status, 401);
        assert.deepEqual(body, {
            success: false,
            message: "Authentication required",
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

test("GET /api/dashboard/stats denies an authenticated student", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "campusfind-test-secret";

    t.after(() => {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    const token = jwt.sign(
        {
            id: "test-student-id",
            role: "student",
        },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await makeRequest(token);
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(body, {
        success: false,
        message: "Access denied",
        errors: [],
    });
});
