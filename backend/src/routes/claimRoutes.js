const express = require("express");
const {
    getClaims,
    getPendingClaims,
    getVerificationQueue,
    createClaim,
    updateClaimStatus,
    verifyClaim,
} = require("../controllers/claimController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { objectIdValidator } = require("../validators/objectIdValidator");
const { validationResult } = require("express-validator");
const router = express.Router();

router.get("/", protect, getClaims);

router.get(
    "/pending",
    protect,
    authorize("staff", "admin"),
    getPendingClaims
);

router.get(
    "/verification-queue",
    protect,
    authorize("staff", "admin"),
    getVerificationQueue
);

router.post("/", protect, createClaim);

router.patch(
    "/:id/status",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        next();
    },
    updateClaimStatus
);

router.patch(
    "/:id/verify",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        next();
    },
    verifyClaim
);

module.exports = router;