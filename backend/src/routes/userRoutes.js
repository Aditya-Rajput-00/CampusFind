const express = require("express");
const {
    getUsers,
    updateUser,
    updateUserRole,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { objectIdValidator } = require("../validators/objectIdValidator");
const { validationResult } = require("express-validator");

const router = express.Router();

router.get("/me", protect, getMyProfile);

router.get("/", protect, authorize("admin"), getUsers);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    objectIdValidator,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        next();
    },
    updateUser
);

router.patch(
    "/:id/role",
    protect,
    authorize("admin"),
    objectIdValidator,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        next();
    },
    updateUserRole
);

router.patch("/me", protect, updateMyProfile);

router.patch("/me/password", protect, changeMyPassword);

module.exports = router;