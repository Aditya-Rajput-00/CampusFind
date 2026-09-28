const Item = require("../models/Item");
const Notification = require("../models/Notification");

const getItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate("reportedBy", "name email")
            .sort({ createdAt: -1 });

        res.json(items);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch items",
        });
    }
};

const createItem = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            type,
            location,
            date,
        } = req.body;

        if (!title || !description || !category || !type) {
            return res.status(400).json({
                message: "Title, description, category, and type are required",
            });
        }

        const item = await Item.create({
            title,
            description,
            category,
            type,
            location,
            date,
            reportedBy: req.user.userId,
        });

        res.status(201).json({
            message: "Item created successfully",
            item,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create item",
        });
    }
};

const updateItemStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "ACTIVE",
            "MATCHED",
            "CLAIMED",
            "UNDER_VERIFICATION",
            "VERIFIED",
            "RETURNED",
            "CLOSED",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid item status",
            });
        }

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        // Create notification for the person who reported the item
        await Notification.create({
            userId: item.reportedBy,
            type: "STATUS_UPDATE",
            title: "Item Status Updated",
            message: `Your ${item.title} status has been updated to ${status}.`,
        });

        res.json({
            message: `Item status updated to ${status}`,
            item,
        });
    } catch (error) {
        console.error("Update item status error:", error);

        res.status(500).json({
            message: "Failed to update item status",
        });
    }
};
module.exports = {
    getItems,
    createItem,
    updateItemStatus,
};