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

module.exports = {
    getMatches,
    createMatch,
};