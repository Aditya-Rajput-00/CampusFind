const express = require("express");
const {
    getMatches,
    getPendingMatches,
    createMatch,
    updateMatchStatus,
} = require("../controllers/matchController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getMatches);

router.get(
    "/pending",
    protect,
    authorize("staff", "admin"),
    getPendingMatches
);

router.post("/", protect, createMatch);

router.patch(
    "/:id/status",
    protect,
    authorize("staff", "admin"),
    updateMatchStatus
);

module.exports = router;