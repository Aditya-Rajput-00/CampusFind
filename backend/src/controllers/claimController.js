
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { successResponse } = require("../utils/apiResponse");
const { escapeRegex, sendPaginatedResponse } = require("../utils/pagination");
const defaultListQuery = { page: 1, limit: 20, offset: 0, search: "" };

const applyClaimSearch = async (filter, search) => {
    if (!search) return;

    const expression = new RegExp(escapeRegex(search), "i");
    const [matchingItems, matchingUsers] = await Promise.all([
        Item.find({ title: expression }).select("_id").lean(),
        User.find({ $or: [{ name: expression }, { email: expression }] })
            .select("_id")
            .lean(),
    ]);
    filter.$and = [{
        $or: [
            { "proof.description": expression },
            { "proof.additionalDetails": expression },
            { itemId: { $in: matchingItems.map(({ _id }) => _id) } },
            { claimantId: { $in: matchingUsers.map(({ _id }) => _id) } },
        ],
    }];
};


const getClaims = async (req, res, next) => {
    try {
        // Students can only see their own claims.
        // Staff and admins can see all claims.
        const { page, limit, offset, search, status } = req.listQuery || defaultListQuery;
        const filter =
            req.user.role === "student"
                ? { claimantId: req.user.userId }
                : {};
        if (status) filter.status = status;

        await applyClaimSearch(filter, search);

        const [claims, totalRecords] = await Promise.all([
            Claim.find(filter)
                .populate("itemId")
                .populate("claimantId", "name email")
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            Claim.countDocuments(filter),
        ]);

        return sendPaginatedResponse(
            res,
            200,
            "Claims fetched successfully",
            claims,
            { page, limit, totalRecords }
        );
    } catch (error) {
        console.error("Get claims error:", error);
        return next(error);
    }
};

const getPendingClaims = async (req, res, next) => {
    try {
        const { page, limit, offset, search } = req.listQuery || defaultListQuery;
        const filter = { status: "PENDING" };
        await applyClaimSearch(filter, search);

        const [claims, totalRecords] = await Promise.all([
            Claim.find(filter)
                .populate("itemId")
                .populate("claimantId", "name email")
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            Claim.countDocuments(filter),
        ]);

        return sendPaginatedResponse(
            res,
            200,
            "Pending claims fetched successfully",
            claims,
            { page, limit, totalRecords }
        );
    } catch (error) {
        console.error("Get pending claims error:", error);
        return next(error);
    }
};

const getVerificationQueue = async (req, res, next) => {
    try {
        const { page, limit, offset, search } = req.listQuery || defaultListQuery;
        const filter = {
            status: "APPROVED",
            "verification.result": { $exists: false },
        };
        await applyClaimSearch(filter, search);

        const [claims, totalRecords] = await Promise.all([
            Claim.find(filter)
                .populate("itemId")
                .populate("claimantId", "name email")
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            Claim.countDocuments(filter),
        ]);

        return sendPaginatedResponse(
            res,
            200,
            "Verification queue fetched successfully",
            claims,
            { page, limit, totalRecords }
        );
    } catch (error) {
        console.error("Get verification queue error:", error);
        return next(error);
    }
};

const createClaim = async (req, res, next) => {
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
        return next(error);
    }
};

const updateClaimStatus = async (req, res, next) => {
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
        return next(error);
    }
};

const verifyClaim = async (req, res, next) => {
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
        return next(error);
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
