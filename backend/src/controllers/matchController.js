
const Match = require("../models/Match");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const { successResponse } = require("../utils/apiResponse");

const getMatches = async (req, res, next) => {
    try {
        const matches = await Match.find()
            .populate("lostItemId")
            .populate("foundItemId")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            200,
            "Matches fetched successfully",
            matches
        );
    } catch (error) {
        console.error("Get matches error:", error);
        return next(error);
    }
};

const getPendingMatches = async (req, res, next) => {
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
        return next(error);
    }
};

const createMatch = async (req, res, next) => {
    try {
        const { lostItemId, foundItemId, matchScore } = req.body;

        if (!lostItemId || !foundItemId || matchScore === undefined) {
            return res.status(400).json({
                success: false,
                message: "Lost item, found item, and match score are required",
                errors: [],
            });
        }

        // Find both items
        const lostItem = await Item.findById(lostItemId);
        const foundItem = await Item.findById(foundItemId);

        if (!lostItem || !foundItem) {
            return res.status(404).json({
                success: false,
                message: "Lost or found item not found",
                errors: [],
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
        return next(error);
    }
};

const updateMatchStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!["CONFIRMED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be CONFIRMED or REJECTED",
                errors: [],
            });
        }

        const match = await Match.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!match) {
            return res.status(404).json({
                success: false,
                message: "Match not found",
                errors: [],
            });
        }

        // Find both items
        const lostItem = await Item.findById(match.lostItemId);
        const foundItem = await Item.findById(match.foundItemId);

        if (!lostItem || !foundItem) {
            return res.status(404).json({
                success: false,
                message: "Related item not found",
                errors: [],
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
            { match }
        );
    } catch (error) {
        console.error("Update match status error:", error);
        return next(error);
    }
};

module.exports = {
    getMatches,
    getPendingMatches,
    createMatch,
    updateMatchStatus,
};
