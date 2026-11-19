const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const {
    BOOTSTRAP_GUARD_ID,
    bootstrapAdmin,
} = require("../scripts/bootstrapAdmin");

const validCredentials = {
    name: " Initial Admin ",
    email: " ADMIN@EXAMPLE.COM ",
    password: "StrongPassword123!",
};

const makeHarness = () => {
    const users = [];
    const guards = new Map();
    let connected = false;
    let disconnectCount = 0;
    const UserModel = {
        exists: async (filter) => users.find((user) => user.role === filter.role) || null,
        create: async (document) => {
            const user = { ...document, _id: `user-${users.length + 1}` };
            users.push(user);
            return user;
        },
    };
    const guardCollection = {
        insertOne: async (guard) => {
            if (guards.has(guard._id)) {
                const error = new Error("duplicate key");
                error.code = 11000;
                throw error;
            }
            guards.set(guard._id, guard);
        },
        updateOne: async (filter, update) => {
            Object.assign(guards.get(filter._id), update.$set);
        },
        deleteOne: async (filter) => guards.delete(filter._id),
    };
    return {
        users,
        guards,
        UserModel,
        guardCollection,
        get disconnectCount() { return disconnectCount; },
        get connected() { return connected; },
        dependencies: {
            connect: async () => { connected = true; },
            disconnect: async () => { connected = false; disconnectCount += 1; },
            UserModel,
            passwordHasher: bcrypt,
            getGuardCollection: () => guardCollection,
        },
    };
};

test("bootstrap creates an approved admin with normalized email and hashed password", async () => {
    const harness = makeHarness();
    const result = await bootstrapAdmin({ ...validCredentials, ...harness.dependencies });

    assert.equal(result.email, "admin@example.com");
    assert.equal(harness.users.length, 1);
    assert.equal(harness.users[0].name, "Initial Admin");
    assert.equal(harness.users[0].role, "admin");
    assert.equal(harness.users[0].accountStatus, "approved");
    assert.notEqual(harness.users[0].passwordHash, validCredentials.password);
    assert.equal(await bcrypt.compare(validCredentials.password, harness.users[0].passwordHash), true);
    assert.equal(harness.guards.get(BOOTSTRAP_GUARD_ID).status, "completed");
    assert.equal(harness.connected, false);
    assert.equal(harness.disconnectCount, 1);
});

test("bootstrap refuses when an administrator already exists", async () => {
    const harness = makeHarness();
    harness.users.push({ role: "admin" });

    await assert.rejects(
        bootstrapAdmin({ ...validCredentials, ...harness.dependencies }),
        /administrator already exists/
    );
    assert.equal(harness.users.length, 1);
    assert.equal(harness.guards.size, 0);
    assert.equal(harness.disconnectCount, 1);
});

test("bootstrap refuses when the one-time guard was already claimed", async () => {
    const harness = makeHarness();
    harness.guards.set(BOOTSTRAP_GUARD_ID, {
        _id: BOOTSTRAP_GUARD_ID,
        status: "completed",
    });

    await assert.rejects(
        bootstrapAdmin({ ...validCredentials, ...harness.dependencies }),
        /already been claimed or completed/
    );
    assert.equal(harness.users.length, 0);
    assert.equal(harness.guards.size, 1);
    assert.equal(harness.disconnectCount, 1);
});

test("bootstrap rejects invalid email and weak password before connecting", async () => {
    const harness = makeHarness();
    await assert.rejects(
        bootstrapAdmin({ ...validCredentials, email: "invalid", ...harness.dependencies }),
        /valid email/
    );
    await assert.rejects(
        bootstrapAdmin({ ...validCredentials, password: "short", ...harness.dependencies }),
        /at least 12 characters/
    );
    assert.equal(harness.connected, false);
    assert.equal(harness.disconnectCount, 0);
});

test("bootstrap releases the guard after a password hashing failure before insertion", async () => {
    const harness = makeHarness();
    const passwordHasher = { hash: async () => { throw new Error("hash failed"); } };

    await assert.rejects(
        bootstrapAdmin({ ...validCredentials, ...harness.dependencies, passwordHasher }),
        /hash failed/
    );
    assert.equal(harness.guards.size, 0);
    assert.equal(harness.users.length, 0);
    assert.equal(harness.disconnectCount, 1);
});

test("bootstrap refuses connection failures and never creates an account", async () => {
    const harness = makeHarness();
    await assert.rejects(
        bootstrapAdmin({
            ...validCredentials,
            ...harness.dependencies,
            connect: async () => { throw new Error("connection unavailable"); },
        }),
        /connection unavailable/
    );
    assert.equal(harness.users.length, 0);
    assert.equal(harness.disconnectCount, 1);
});

test("a unique guard allows only one of two concurrent bootstrap attempts", async () => {
    const harness = makeHarness();
    const attempts = await Promise.allSettled([
        bootstrapAdmin({ ...validCredentials, ...harness.dependencies }),
        bootstrapAdmin({ ...validCredentials, ...harness.dependencies }),
    ]);

    assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1);
    assert.equal(attempts.filter((attempt) => attempt.status === "rejected").length, 1);
    assert.equal(harness.users.filter((user) => user.role === "admin").length, 1);
    assert.equal(harness.guards.get(BOOTSTRAP_GUARD_ID).status, "completed");
    assert.equal(harness.disconnectCount, 2);
});

test("a failed user insertion leaves the guard for operator review", async () => {
    const harness = makeHarness();
    harness.UserModel.create = async () => { throw new Error("write failed"); };

    await assert.rejects(
        bootstrapAdmin({ ...validCredentials, ...harness.dependencies }),
        /write failed/
    );
    assert.equal(harness.guards.get(BOOTSTRAP_GUARD_ID).status, "in-progress");
    assert.equal(harness.guards.size, 1);
    assert.equal(harness.disconnectCount, 1);
});
