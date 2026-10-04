const Item = require("../models/Item");
const Notification = require("../models/Notification");

const getItems = async (req, res) => {
    try {
        const {
            search,
            category,
            type,
            building,
            date,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc",
        } = req.query;

        const filter = {};
        const skip = (Number(page) - 1) * Number(limit);
        const sortOrder = order === "asc" ? 1 : -1;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        if (category) {
            filter.category = category;
        }

        if (type) {
            filter.type = type;
        }

        if (building) {
            filter["location.building"] = {
                $regex: building,
                $options: "i",
            };
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);

            endDate.setDate(endDate.getDate() + 1);

            filter.date = {
                $gte: startDate,
                $lt: endDate,
            };
        }

        const totalItems = await Item.countDocuments(filter);

        const items = await Item.find(filter)
            .populate("reportedBy", "name email")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            items,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / Number(limit)),
            },
        });

    } catch (error) {
        console.error("Get items error:", error);

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

        if (!title || !description || !category || !type || !date) {
            return res.status(400).json({
                message: "Title, description, category, type, and date are required",
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
const returnItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        if (item.status !== "VERIFIED") {
            return res.status(400).json({
                message: "Item must be verified before it can be returned",
            });
        }

        item.status = "RETURNED";
        await item.save();

        await Notification.create({
            userId: item.reportedBy,
            type: "STATUS_UPDATE",
            title: "Item Returned",
            message: `Your ${item.title} has been marked as returned.`,
        });

        res.json({
            message: "Item returned successfully",
            item,
        });
    } catch (error) {
        console.error("Return item error:", error);

        res.status(500).json({
            message: "Failed to return item",
        });
    }
};
const closeItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        if (item.status !== "RETURNED") {
            return res.status(400).json({
                message: "Item must be returned before it can be closed",
            });
        }

        item.status = "CLOSED";
        await item.save();

        res.json({
            message: "Item closed successfully",
            item,
        });
    } catch (error) {
        console.error("Close item error:", error);

        res.status(500).json({
            message: "Failed to close item",
        });
    }
};
module.exports = {
    getItems,
    createItem,
    updateItemStatus,
    returnItem,
    closeItem,
};