const { param } = require("express-validator");

const objectIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid ID"),
];

module.exports = {
    objectIdValidator,
};