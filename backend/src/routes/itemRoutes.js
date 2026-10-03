const express = require("express");
const {
    getItems,
    createItem,
    updateItemStatus,
    returnItem,
} = require("../controllers/itemController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getItems);
router.post("/", protect, createItem);
router.patch(
    "/:id/status",
    protect,
    authorize("staff", "admin"),
    updateItemStatus
);
router.patch(
    "/:id/return",
    protect,
    authorize("staff", "admin"),
    returnItem
);

module.exports = router;