const test = require("node:test");
const assert = require("node:assert/strict");
const { validationResult } = require("express-validator");
const { createItemValidator } = require("../src/validators/itemValidator");

const validFields = {
    title: "Lost keys",
    description: "Keys near the entrance",
    category: "Accessories",
    type: "lost",
    date: "2026-10-16",
};

const validate = async (body) => {
    const req = { body: { ...validFields, ...body } };
    for (const validator of createItemValidator) {
        await validator.run(req);
    }
    return { req, errors: validationResult(req).array() };
};

test("createItemValidator parses and trims JSON multipart locations", async () => {
    const { req, errors } = await validate({
        location: JSON.stringify({
            building: "  North Annex  ",
            area: "  West entrance  ",
        }),
    });

    assert.deepEqual(errors, []);
    assert.deepEqual(req.body.location, {
        building: "North Annex",
        area: "West entrance",
    });
});

test("createItemValidator accepts a custom building without an optional landmark", async () => {
    const { req, errors } = await validate({
        location: JSON.stringify({ building: "North Annex" }),
    });

    assert.deepEqual(errors, []);
    assert.deepEqual(req.body.location, { building: "North Annex" });
});

test("createItemValidator rejects malformed JSON and missing campus locations", async () => {
    const malformed = await validate({ location: "{invalid" });
    const missing = await validate({ location: JSON.stringify({ area: "Lobby" }) });

    assert.ok(malformed.errors.some((error) => error.path === "location"));
    assert.ok(missing.errors.some((error) => error.path === "location.building"));
});

test("createItemValidator rejects a whitespace-only campus location", async () => {
    const { errors } = await validate({
        location: JSON.stringify({ building: "   " }),
    });

    assert.ok(errors.some((error) => error.path === "location.building"));
});

test("createItemValidator rejects non-text landmarks", async () => {
    const { errors } = await validate({
        location: JSON.stringify({ building: "Library", area: 12 }),
    });

    assert.ok(errors.some((error) => error.path === "location.area"));
});
