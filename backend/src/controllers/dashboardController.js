const User = require("../models/User");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const Match = require("../models/Match");

const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalItems,
            lostItems,
            foundItems,
            activeItems,
            returnedItems,
            pendingClaims,
            pendingMatches,
        ] = await Promise.all([
            User.countDocuments(),
            Item.countDocuments(),
            Item.countDocuments({ type: "lost" }),
            Item.countDocuments({ type: "found" }),
            Item.countDocuments({ status: "ACTIVE" }),
            Item.countDocuments({ status: "RETURNED" }),
            Claim.countDocuments({ status: "PENDING" }),
            Match.countDocuments({ status: "PENDING" }),
        ]);

        res.status(200).json({
            totalUsers,
            totalItems,
            lostItems,
            foundItems,
            activeItems,
            returnedItems,
            pendingClaims,
            pendingMatches,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard statistics",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboardStats,
};