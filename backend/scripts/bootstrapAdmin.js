require("dotenv").config();

const readline = require("node:readline");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../src/models/User");

const BOOTSTRAP_GUARD_ID = "first-admin";
const PASSWORD_COST = 10;

const normalizeAndValidateInput = ({ name, email, password }) => {
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (!normalizedName) {
        throw new Error("Admin name is required.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error("Enter a valid email address.");
    }

    if (
        typeof password !== "string" ||
        password.length < 12 ||
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/\d/.test(password) ||
        !/[^A-Za-z0-9]/.test(password)
    ) {
        throw new Error(
            "Password must be at least 12 characters and include lowercase, uppercase, number, and symbol characters."
        );
    }

    return { name: normalizedName, email: normalizedEmail, password };
};

const bootstrapAdmin = async ({
    name,
    email,
    password,
    connect = async () => {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is required to connect to MongoDB.");
        }
        await mongoose.connect(process.env.MONGO_URI);
    },
    disconnect = () => mongoose.disconnect(),
    UserModel = User,
    passwordHasher = bcrypt,
    getGuardCollection = () => mongoose.connection.db.collection("adminBootstrapGuards"),
}) => {
    const input = normalizeAndValidateInput({ name, email, password });
    let connected = false;
    let connectionAttempted = false;
    let guardAcquired = false;
    let userCreationAttempted = false;

    try {
        connectionAttempted = true;
        await connect();
        connected = true;

        const existingAdmin = await UserModel.exists({ role: "admin" });
        if (existingAdmin) {
            throw new Error("An administrator already exists; bootstrap is disabled.");
        }

        const guardCollection = getGuardCollection();
        try {
            await guardCollection.insertOne({
                _id: BOOTSTRAP_GUARD_ID,
                status: "in-progress",
                createdAt: new Date(),
            });
            guardAcquired = true;
        } catch (error) {
            if (error.code === 11000) {
                throw new Error(
                    "The first-admin bootstrap has already been claimed or completed. Check the admin account and bootstrap guard before recovery."
                );
            }
            throw error;
        }

        // Recheck after taking the unique guard in case a privileged account
        // appeared between the initial check and the atomic claim.
        if (await UserModel.exists({ role: "admin" })) {
            throw new Error("An administrator already exists; bootstrap is disabled.");
        }

        const passwordHash = await passwordHasher.hash(input.password, PASSWORD_COST);
        userCreationAttempted = true;
        const admin = await UserModel.create({
            name: input.name,
            email: input.email,
            passwordHash,
            role: "admin",
            accountStatus: "approved",
        });

        await guardCollection.updateOne(
            { _id: BOOTSTRAP_GUARD_ID },
            { $set: { status: "completed", completedAt: new Date() } }
        );

        return { id: admin._id, email: input.email };
    } catch (error) {
        // Before attempting user insertion, release the guard only after
        // confirming no admin exists. Once insertion has been attempted, its
        // outcome may be ambiguous, so keep the guard for operator review.
        if (connected && guardAcquired && !userCreationAttempted) {
            try {
                const adminExists = await UserModel.exists({ role: "admin" });
                if (!adminExists) {
                    await getGuardCollection().deleteOne({ _id: BOOTSTRAP_GUARD_ID });
                }
            } catch {
                // Keep the guard on uncertain database state; see recovery message.
            }
        }
        throw error;
    } finally {
        if (connectionAttempted) {
            await disconnect();
        }
    }
};

const ask = (rl, prompt, { hidden = false } = {}) => new Promise((resolve, reject) => {
    if (hidden) {
        // readline otherwise echoes typed password characters to the terminal.
        process.stdout.write(prompt);
        rl._writeToOutput = () => {};
        prompt = "";
    }
    rl.question(prompt, (answer) => resolve(answer));
    rl.once("SIGINT", () => reject(new Error("Input cancelled.")));
});

const collectCredentials = async () => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error("Run bootstrap from an interactive terminal so the password can be entered privately.");
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });

    try {
        const name = await ask(rl, "Admin name: ");
        const email = await ask(rl, "Admin email: ");
        console.log("Password input is hidden.");
        const password = await ask(rl, "Admin password: ", { hidden: true });
        const confirmPassword = await ask(rl, "Confirm password: ", { hidden: true });
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match.");
        }
        return { name, email, password };
    } finally {
        rl.close();
    }
};

const main = async () => {
    try {
        const credentials = await collectCredentials();
        const admin = await bootstrapAdmin(credentials);
        console.log(`Initial administrator created for ${admin.email}.`);
    } catch (error) {
        console.error(`Admin bootstrap failed: ${error.message}`);
        process.exitCode = 1;
    }
};

if (require.main === module) {
    main();
}

module.exports = {
    BOOTSTRAP_GUARD_ID,
    bootstrapAdmin,
    normalizeAndValidateInput,
};
