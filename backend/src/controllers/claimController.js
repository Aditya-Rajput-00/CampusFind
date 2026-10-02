const Claim = require("../models/Claim");
const Item = require("../models/Item");
const Notification = require("../models/Notification");

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

        // Find the item being claimed
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        // Create the claim
        const claim = await Claim.create({
            itemId,
            claimantId: req.user.userId,
            proof: {
                description: proof.description,
                additionalDetails: proof.additionalDetails,
            },
        });

        // Create notification for the person who reported the item
        await Notification.create({
            userId: item.reportedBy,
            type: "CLAIM",
            title: "New Claim Received",
            message: `Someone has submitted a claim for your ${item.title}.`,
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
const updateClaimStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                message: "Status must be APPROVED or REJECTED",
            });
        }

        const claim = await Claim.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }
        if (status === "APPROVED") {
            const item = await Item.findById(claim.itemId);

            if (!item) {
                return res.status(404).json({
                    message: "Related item not found",
                });
            }

            item.status = "UNDER_VERIFICATION";
            await item.save();
        }

        // Create notification for the claimant
        await Notification.create({
            userId: claim.claimantId,
            type: "CLAIM",
            title: `Claim ${status === "APPROVED" ? "Approved" : "Rejected"}`,
            message:
                status === "APPROVED"
                    ? "Your claim has been approved."
                    : "Your claim has been rejected.",
        });

        res.json({
            message: `Claim ${status.toLowerCase()} successfully`,
            claim,
        });
    } catch (error) {
        console.error("Update claim status error:", error);

        res.status(500).json({
            message: "Failed to update claim status",
        });
    }
};
const verifyClaim = async (req, res) => {
    try {
        const { result, notes } = req.body;

        if (!["SUCCESS", "FAILURE"].includes(result)) {
            return res.status(400).json({
                message: "Result must be SUCCESS or FAILURE",
            });
        }

        const claim = await Claim.findById(req.params.id);

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        claim.verification = {
            result,
            verifiedBy: req.user.userId,
            verifiedAt: new Date(),
            notes,
        };

        await claim.save();

        res.json({
            message: `Verification ${result.toLowerCase()} recorded successfully`,
            claim,
        });
    } catch (error) {
        console.error("Verify claim error:", error);

        res.status(500).json({
            message: "Failed to verify claim",
        });
    }
};
module.exports = {
    getClaims,
    createClaim,
    updateClaimStatus,
    verifyClaim,
};