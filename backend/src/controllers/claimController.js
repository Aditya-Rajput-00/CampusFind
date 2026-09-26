const Claim = require("../models/Claim");

const getClaims = async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("itemId")
            .populate("claimantId", "name email")
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch claims",
        });
    }
};

const createClaim = async (req, res) => {
    try {
        const { itemId, proof } = req.body;

        if (!itemId) {
            return res.status(400).json({
                message: "Item ID is required",
            });
        }

        if (!proof || !proof.description) {
            return res.status(400).json({
                message: "Proof description is required",
            });
        }

        const claim = await Claim.create({
            itemId,
            claimantId: req.user.userId,
            proof: {
                description: proof.description,
                additionalDetails: proof.additionalDetails,
            },
        });

        res.status(201).json({
            message: "Claim created successfully",
            claim,
        });
    } catch (error) {
        console.error("Create claim error:", error);

        res.status(500).json({
            message: "Failed to create claim",
        });
    }
};

module.exports = {
    getClaims,
    createClaim,
};