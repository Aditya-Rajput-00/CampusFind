
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const { successResponse } = require("../utils/apiResponse");

const getClaims = async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("itemId")
            .populate("claimantId", "name email")
            .sort({ createdAt: -1 });

        return successResponse(res, 200, "Claims fetched successfully", claims);
    } catch (error) {
        console.error("Get claims error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch claims",
            errors: [],
        });
    }
};

const getPendingClaims = async (req, res) => {
    try {
        const claims = await Claim.find({ status: "PENDING" })
            .populate("itemId")
            .populate("claimantId", "name email")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            200,
            "Pending claims fetched successfully",
            claims
        );
    } catch (error) {
        console.error("Get pending claims error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending claims",
            errors: [],
        });
    }
};

const getVerificationQueue = async (req, res) => {
    try {
        const claims = await Claim.find({
            status: "APPROVED",
            "verification.result": { $exists: false },
        })
            .populate("itemId")
            .populate("claimantId", "name email")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            200,
            "Verification queue fetched successfully",
            claims
        );
    } catch (error) {
        console.error("Get verification queue error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch verification queue",
            errors: [],
        });
    }
};

const createClaim = async (req, res) => {
    try {
        const { itemId, proof } = req.body;

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: "Item ID is required",
                errors: [],
            });
        }

        if (!proof || !proof.description) {
            return res.status(400).json({
                success: false,
                message: "Proof description is required",
                errors: [],
            });
        }

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
                errors: [],
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

        await Notification.create({
            userId: item.reportedBy,
            type: "CLAIM",
            title: "New Claim Received",
            message: `Someone has submitted a claim for your ${item.title}.`,
        });

        return successResponse(res, 201, "Claim created successfully", {
            claim,
        });
    } catch (error) {
        console.error("Create claim error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create claim",
            errors: [],
        });
    }
};

const updateClaimStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be APPROVED or REJECTED",
                errors: [],
            });
        }

        const claim = await Claim.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!claim) {
            return res.status(404).json({
                success: false,
                message: "Claim not found",
                errors: [],
            });
        }

        if (status === "APPROVED") {
            const item = await Item.findById(claim.itemId);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: "Related item not found",
                    errors: [],
                });
            }

            item.status = "UNDER_VERIFICATION";
            await item.save();
        }

        await Notification.create({
            userId: claim.claimantId,
            type: "CLAIM",
            title: `Claim ${status === "APPROVED" ? "Approved" : "Rejected"}`,
            message:
                status === "APPROVED"
                    ? "Your claim has been approved."
                    : "Your claim has been rejected.",
        });

        return successResponse(
            res,
            200,
            `Claim ${status.toLowerCase()} successfully`,
            { claim }
        );
    } catch (error) {
        console.error("Update claim status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update claim status",
            errors: [],
        });
    }
};

const verifyClaim = async (req, res) => {
    try {
        const { result, notes } = req.body;

        if (!["SUCCESS", "FAILURE"].includes(result)) {
            return res.status(400).json({
                success: false,
                message: "Result must be SUCCESS or FAILURE",
                errors: [],
            });
        }

        const claim = await Claim.findById(req.params.id);

        if (!claim) {
            return res.status(404).json({
                success: false,
                message: "Claim not found",
                errors: [],
            });
        }

        claim.verification = {
            result,
            verifiedBy: req.user.userId,
            verifiedAt: new Date(),
            notes,
        };

        await claim.save();

        await Notification.create({
            userId: claim.claimantId,
            type: "STATUS_UPDATE",
            title: `Verification ${result === "SUCCESS" ? "Successful" : "Failed"}`,
            message:
                result === "SUCCESS"
                    ? "Your ownership verification was successful."
                    : "Your ownership verification has failed.",
        });

        return successResponse(
            res,
            200,
            `Verification ${result.toLowerCase()} recorded successfully`,
            { claim }
        );
    } catch (error) {
        console.error("Verify claim error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify claim",
            errors: [],
        });
    }
};

module.exports = {
    getClaims,
    getPendingClaims,
    getVerificationQueue,
    createClaim,
    updateClaimStatus,
    verifyClaim,
};
