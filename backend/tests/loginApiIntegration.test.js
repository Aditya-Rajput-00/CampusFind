
const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

test("POST /api/auth/login returns a JWT for valid credentials", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    const originalExpiresIn = process.env.JWT_EXPIRES_IN;

    process.env.JWT_SECRET = "campusfind-test-secret";
    process.env.JWT_EXPIRES_IN = "1h";

    try {
        const passwordHash = await bcrypt.hash("CorrectPassword123", 10);

        const mockUser = {
            _id: "test-user-id",
            name: "Test User",
            email: "student@example.com",
            passwordHash,
            role: "student",
            department: "Computer Science",
            phone: "9999999999"
        };

        t.mock.method(User, "findOne", async () => mockUser);

        const response = await makeRequest("/api/auth/login", {
            email: "student@example.com",
            password: "CorrectPassword123"
        });

        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(body.message, "Login successful");
        assert.ok(body.data.token);

        const decodedToken = jwt.verify(
            body.data.token,
            process.env.JWT_SECRET
        );

        assert.equal(decodedToken.userId, "test-user-id");
        assert.equal(decodedToken.role, "student");
        assert.equal(body.data.user.email, "student@example.com");
        assert.equal(body.data.user.name, "Test User");
        assert.equal(body.data.user.passwordHash, undefined);
    } finally {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }

        if (originalExpiresIn === undefined) {
            delete process.env.JWT_EXPIRES_IN;
        } else {
            process.env.JWT_EXPIRES_IN = originalExpiresIn;
        }
    }
});
