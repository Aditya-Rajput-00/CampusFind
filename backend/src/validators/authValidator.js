
const { body } = require("express-validator");

const registerValidator = [
    body("name")
        .isString()
        .withMessage("Name must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Name is required"),

    body("email")
        .isString()
        .withMessage("Email must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .bail()
        .isEmail()
        .withMessage("Enter a valid email address")
        .normalizeEmail(),

    body("password")
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .notEmpty()
        .withMessage("Password is required"),

    // Public registration only permits the student role.
    body("role")
        .optional()
        .isIn(["student"])
        .withMessage("Public registration only allows the student role"),

    body("department")
        .optional()
        .isString()
        .withMessage("Department must be a string")
        .bail()
        .trim(),

    body("phone")
        .optional()
        .isString()
        .withMessage("Phone must be a string")
        .bail()
        .trim(),
];

const loginValidator = [
    body("email")
        .isString()
        .withMessage("Email must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .bail()
        .isEmail()
        .withMessage("Enter a valid email address"),

    body("password")
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .notEmpty()
        .withMessage("Password is required"),
];

module.exports = {
    registerValidator,
    loginValidator,
};
