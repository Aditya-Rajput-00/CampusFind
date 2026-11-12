
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");

const TEST_USER_ID = "64b000000000000000000001";

async function makeRequest() {
    const server = app.listen(0);

    try {
        const address = server.address();

        return await fetch(
            `http://127.0.0.1:${address.port}/api/claims`
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

test("GET /api/claims rejects requests without authentication", async () => {
    const response = await makeRequest();
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
        success: false,
        message: "Authentication required",
        errors: [],
    });
});

test("GET /api/claims/pending denies an authenticated student", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    const originalFindById = User.findById;

    process.env.JWT_SECRET = "campusfind-test-secret";

    User.findById = async (id) => {
        assert.equal(id, TEST_USER_ID);

        return {
            _id: TEST_USER_ID,
            role: "student",
            accountStatus: "approved",
        };
    };

    t.after(() => {
        User.findById = originalFindById;

        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    const token = jwt.sign(
        {
            userId: TEST_USER_ID,
            role: "student",
        },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );

    const server = app.listen(0);

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/claims/pending`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const body = await response.json();

        assert.equal(response.status, 403);
        assert.deepEqual(body, {
            success: false,
            message: "Access denied",
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
