const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.userId,
        }).sort({ createdAt: -1 });

        res.json(notifications);
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

        res.status(201).json({
            message: "Notification created successfully",
            notification,
        });
    } catch (error) {
        console.error("Create notification error:", error);

        res.status(500).json({
            message: "Failed to create notification",
        });
    }
};

module.exports = {
    getNotifications,
    createNotification,
};