const Match = require("../models/Match");

const getMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .populate("lostItemId")
            .populate("foundItemId")
            .sort({ createdAt: -1 });

        res.json(matches);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch matches",
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

        const match = await Match.create({
            lostItemId,
            foundItemId,
            matchScore,
        });

        res.status(201).json({
            message: "Match created successfully",
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

        res.json({
            message: `Match ${status.toLowerCase()} successfully`,
            match,
        });
    } catch (error) {
        console.error("Update match status error:", error);

        res.status(500).json({
            message: "Failed to update match status",
        });
    }
};

module.exports = {
    getMatches,
    createMatch,
    updateMatchStatus,
};