const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch notifications",
        });
    }
};

module.exports = {
    getNotifications,
};