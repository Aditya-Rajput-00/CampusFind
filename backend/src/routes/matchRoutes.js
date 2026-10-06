const express = require("express");
const {
    getMatches,
    getPendingMatches,
    createMatch,
    updateMatchStatus,
} = require("../controllers/matchController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { createMatchValidator } = require("../validators/matchValidator");
const { validationResult } = require("express-validator");

const router = express.Router();

router.get("/", protect, getMatches);

router.get(
    "/pending",
    protect,
    authorize("staff", "admin"),
    getPendingMatches
);

router.post(
    "/",
    protect,
    createMatchValidator,
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
    createMatch
);

router.patch(
    "/:id/status",
    protect,
    authorize("staff", "admin"),
    updateMatchStatus
);

module.exports = router;