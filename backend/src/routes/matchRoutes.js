const express = require("express");
const {
    getMatches,
    createMatch,
} = require("../controllers/matchController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getMatches);
router.post("/", protect, createMatch);

module.exports = router;