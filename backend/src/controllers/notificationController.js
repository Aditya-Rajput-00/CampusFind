const Notification = require("../models/Notification");
const { successResponse } = require("../utils/apiResponse");

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.userId,
        }).sort({ createdAt: -1 });

        return successResponse(
            res,
            200,
            "Notifications fetched successfully",
            notifications
        );
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch notifications",
        });
    }
};

const createNotification = async (req, res) => {
    try {
        const { userId, type, title, message } = req.body;

        if (!userId || !type || !title || !message) {
            return res.status(400).json({
                message: "User ID, type, title, and message are required",
            });
        }

        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
        });

        return successResponse(
            res,
            201,
            "Notification created successfully",
            { notification }
        );
    } catch (error) {
        console.error("Create notification error:", error);

        res.status(500).json({
            message: "Failed to create notification",
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId,
            },
            {
                isRead: true,
            },
            {
                new: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        return successResponse(
            res,
            200,
            "Notification marked as read successfully",
            { notification }
        );
    } catch (error) {
        console.error("Mark notification as read error:", error);

        res.status(500).json({
            message: "Failed to mark notification as read",
        });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                userId: req.user.userId,
                isRead: false,
            },
            {
                isRead: true,
            }
        );

        return successResponse(
            res,
            200,
            "All notifications marked as read successfully"
        );
    } catch (error) {
        console.error("Mark all notifications as read error:", error);

        res.status(500).json({
            message: "Failed to mark all notifications as read",
        });
    }
};

module.exports = {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
};