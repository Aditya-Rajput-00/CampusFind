const Item = require("../models/Item");

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

module.exports = {
    getItems,
    createItem,
};