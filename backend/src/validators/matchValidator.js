const { body } = require("express-validator");

const createMatchValidator = [
    body("matchScore")
        .isFloat({ min: 0, max: 100 })
        .withMessage("Match score must be a number between 0 and 100"),
];

module.exports = {
    createMatchValidator,
};