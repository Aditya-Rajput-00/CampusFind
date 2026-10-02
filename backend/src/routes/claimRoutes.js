const express = require("express");
const {
    getClaims,
    createClaim,
    updateClaimStatus,
    verifyClaim,
} = require("../controllers/claimController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getClaims);

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