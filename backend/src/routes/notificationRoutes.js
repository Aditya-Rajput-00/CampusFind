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

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications
 *     description: Retrieve notifications belonging to the authenticated user, newest first.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to fetch notifications
 */
router.get("/", protect, getNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a notification
 *     description: Create a notification with the supplied user ID, type, title, and message.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: MongoDB ID of the notification recipient
 *                 example: "507f1f77bcf86cd799439011"
 *               type:
 *                 type: string
 *                 description: Notification type
 *                 example: MATCH
 *               title:
 *                 type: string
 *                 description: Notification title
 *                 example: Potential Match Found
 *               message:
 *                 type: string
 *                 description: Notification message
 *                 example: A potential match was found for your lost item.
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Required fields are missing
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to create notification
 */
router.post("/", protect, createNotification);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Mark all unread notifications belonging to the authenticated user as read.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to mark all notifications as read
 */
router.patch("/read-all", protect, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Mark a notification as read if it belongs to the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the notification
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Failed to mark notification as read
 */
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
