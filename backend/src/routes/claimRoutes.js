const express = require("express");
const {
    getClaims,
    createClaim,
} = require("../controllers/claimController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getClaims);
router.post("/", protect, createClaim);

module.exports = router;