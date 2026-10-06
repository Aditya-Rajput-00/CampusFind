const { body } = require("express-validator");

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
];

module.exports = {
    createItemValidator,
};