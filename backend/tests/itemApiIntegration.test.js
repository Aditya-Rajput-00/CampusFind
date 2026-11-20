
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const Item = require("../src/models/Item");
const User = require("../src/models/User");

const TEST_USER_ID = "64b000000000000000000001";

async function makeRequest() {
    const server = app.listen(0);

    try {
        const address = server.address();

        return await fetch(
            `http://127.0.0.1:${address.port}/api/items`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: "Test Backpack",
                }),
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

test("POST /api/items rejects requests without authentication", async () => {
    const response = await makeRequest();
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
        success: false,
        message: "Authentication required",
        errors: [],
    });
});

test("POST /api/items normalizes and forwards a custom multipart location", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    const originalFindById = User.findById;
    const originalCreate = Item.create;
    let savedItem;

    process.env.JWT_SECRET = "campusfind-test-secret";
    User.findById = async (id) => ({
        _id: id,
        role: "student",
        accountStatus: "approved",
    });
    Item.create = async (data) => {
        savedItem = data;
        return { _id: "64b000000000000000000099", ...data };
    };

    t.after(() => {
        User.findById = originalFindById;
        Item.create = originalCreate;

        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    const token = jwt.sign(
        { userId: TEST_USER_ID, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );
    const formData = new FormData();
    formData.append("title", "Lost keys");
    formData.append("description", "Keys near the entrance");
    formData.append("category", "Accessories");
    formData.append("type", "lost");
    formData.append("date", "2026-10-16");
    formData.append("location", JSON.stringify({
        building: "  North Annex  ",
        area: "  West entrance  ",
    }));

    const server = app.listen(0);

    try {
        const address = server.address();
        const response = await fetch(`http://127.0.0.1:${address.port}/api/items`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const body = await response.json();

        assert.equal(response.status, 201);
        assert.equal(body.success, true);
        assert.deepEqual(savedItem.location, {
            building: "North Annex",
            area: "West entrance",
        });
        assert.deepEqual(body.data.item.location, savedItem.location);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
});

test("PATCH /api/items/:id/status denies an authenticated student", async (t) => {
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
            `http://127.0.0.1:${address.port}/api/items/507f1f77bcf86cd799439011/status`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "CLOSED",
                }),
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
