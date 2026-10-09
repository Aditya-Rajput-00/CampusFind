
const User = require("../models/User");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const Match = require("../models/Match");
const { successResponse } = require("../utils/apiResponse");

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

        return successResponse(res, 200, "Dashboard statistics fetched successfully", {
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
        console.error("Get dashboard statistics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
            errors: [],
        });
    }
};

module.exports = {
    getDashboardStats,
};
