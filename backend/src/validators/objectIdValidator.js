const { param } = require("express-validator");

const itemIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid item ID"),
];

module.exports = {
    itemIdValidator,
};
