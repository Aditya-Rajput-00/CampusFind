const express = require("express");
const { getUsers } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, authorize("admin"), getUsers);

module.exports = router;