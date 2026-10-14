
const { body } = require("express-validator");

const changePasswordValidator = [
    body("currentPassword")
        .isString()
        .withMessage("Current password must be a string")
        .bail()
        .notEmpty()
        .withMessage("Current password is required"),

    body("newPassword")
        .isString()
        .withMessage("New password must be a string")
        .bail()
        .notEmpty()
        .withMessage("New password is required")
        .bail()
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters"),
];

module.exports = {
    changePasswordValidator,
};
