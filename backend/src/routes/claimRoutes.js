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
    updateClaimStatus
);
router.patch(
    "/:id/verify",
    protect,
    authorize("staff", "admin"),
    verifyClaim
);

module.exports = router;