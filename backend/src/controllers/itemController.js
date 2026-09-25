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

module.exports = {
    getItems,
};