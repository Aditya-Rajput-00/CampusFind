const { body } = require("express-validator");

const parseLocation = (value) => {
    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const createItemValidator = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required"),

    body("category")
        .trim()
        .notEmpty()
        .withMessage("Category is required"),

    body("type")
        .isIn(["lost", "found"])
        .withMessage("Type must be either lost or found"),

    body("date")
        .isISO8601()
        .withMessage("Date must be a valid date"),

    body("location")
        .customSanitizer(parseLocation)
        .isObject()
        .withMessage("Location must be a valid JSON object"),

    body("location.building")
        .isString()
        .withMessage("Campus location is required")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Campus location is required"),

    body("location.area")
        .optional()
        .isString()
        .withMessage("Specific landmark must be text")
        .bail()
        .trim(),
];

module.exports = {
    createItemValidator,
};
