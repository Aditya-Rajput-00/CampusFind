const express = require("express");

const {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");
const { objectIdValidator } = require("../validators/objectIdValidator");
const { validationResult } = require("express-validator");

const router = express.Router();

router.get("/", protect, getNotifications);

router.post("/", protect, createNotification);

router.patch("/read-all", protect, markAllAsRead);

router.patch(
    "/:id/read",
    protect,
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
    markAsRead
);

module.exports = router;