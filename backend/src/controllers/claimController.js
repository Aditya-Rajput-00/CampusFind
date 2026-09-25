const Claim = require("../models/Claim");

const getClaims = async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("item")
            .populate("claimedBy", "name email")
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch claims",
        });
    }
};

module.exports = {
    getClaims,
};