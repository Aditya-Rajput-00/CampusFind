const express = require("express");
const {
    getClaims,
    createClaim,
    updateClaimStatus,
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

module.exports = router;