const Match = require("../models/Match");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const { successResponse } = require("../utils/apiResponse");

const getMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .populate("lostItemId")
            .populate("foundItemId")
            .sort({ createdAt: -1 });

        return successResponse(res, 200, "Matches fetched successfully", matches);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch matches",
        });
    }
};

const getPendingMatches = async (req, res) => {
    try {
        const matches = await Match.find({ status: "PENDING" })
            .populate("lostItemId")
            .populate("foundItemId")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            200,
            "Pending matches fetched successfully",
            matches
        );
    } catch (error) {
        console.error("Get pending matches error:", error);

        res.status(500).json({
            message: "Failed to fetch pending matches",
        });
    }
};

const createMatch = async (req, res) => {
    try {
        const { lostItemId, foundItemId, matchScore } = req.body;

        if (!lostItemId || !foundItemId || matchScore === undefined) {
            return res.status(400).json({
                message: "Lost item, found item, and match score are required",
            });
        }

        // Find both items
        const lostItem = await Item.findById(lostItemId);
        const foundItem = await Item.findById(foundItemId);

        if (!lostItem || !foundItem) {
            return res.status(404).json({
                message: "Lost or found item not found",
            });
        }

        // Create the match
        const match = await Match.create({
            lostItemId,
            foundItemId,
            matchScore,
        });

        // Notify the person who reported the lost item
        await Notification.create({
            userId: lostItem.reportedBy,
            type: "MATCH",
            title: "Potential Match Found",
            message: `A potential match was found for your lost item: ${lostItem.title}.`,
        });

        // Notify the person who reported the found item
        await Notification.create({
            userId: foundItem.reportedBy,
            type: "MATCH",
            title: "Potential Match Found",
            message: `A potential match was found for your found item: ${foundItem.title}.`,
        });

        return successResponse(res, 201, "Match created successfully", {
            match,
        });
    } catch (error) {
        console.error("Create match error:", error);

        res.status(500).json({
            message: "Failed to create match",
        });
    }
};

const updateMatchStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["CONFIRMED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                message: "Status must be CONFIRMED or REJECTED",
            });
        }

        const match = await Match.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!match) {
            return res.status(404).json({
                message: "Match not found",
            });
        }

        // Find both items
        const lostItem = await Item.findById(match.lostItemId);
        const foundItem = await Item.findById(match.foundItemId);

        if (!lostItem || !foundItem) {
            return res.status(404).json({
                message: "Related item not found",
            });
        }
        if (status === "CONFIRMED") {
            lostItem.status = "MATCHED";
            foundItem.status = "MATCHED";

            await lostItem.save();
            await foundItem.save();
        }

        // Notify the person who reported the lost item
        await Notification.create({
            userId: lostItem.reportedBy,
            type: "MATCH",
            title: `Match ${status === "CONFIRMED" ? "Confirmed" : "Rejected"}`,
            message: `The match for your lost item "${lostItem.title}" has been ${status.toLowerCase()}.`,
        });

        // Notify the person who reported the found item
        await Notification.create({
            userId: foundItem.reportedBy,
            type: "MATCH",
            title: `Match ${status === "CONFIRMED" ? "Confirmed" : "Rejected"}`,
            message: `The match for your found item "${foundItem.title}" has been ${status.toLowerCase()}.`,
        });

        return successResponse(
            res,
            200,
            `Match ${status.toLowerCase()} successfully`,
            {
                match,
            }
        );
    } catch (error) {
        console.error("Update match status error:", error);

        res.status(500).json({
            message: "Failed to update match status",
        });
    }
};

module.exports = {
    getMatches,
    getPendingMatches,
    createMatch,
    updateMatchStatus,
};