const express = require("express");
const {
    getUsers,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/me", protect, getMyProfile);

router.get("/", protect, authorize("admin"), getUsers);

router.patch("/me", protect, updateMyProfile); 

router.patch("/me/password", protect, changeMyPassword);

module.exports = router;