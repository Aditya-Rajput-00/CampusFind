const Match = require("../models/Match");

const getMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .populate("item")
            .populate("claim")
            .sort({ createdAt: -1 });

        res.json(matches);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch matches",
        });
    }
};

module.exports = {
    getMatches,
};