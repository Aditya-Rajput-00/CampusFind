const express = require("express");
const {
    getItems,
    createItem,
    updateItemStatus,
    returnItem,
    closeItem,
} = require("../controllers/itemController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getItems);
router.post("/", protect, upload.single("image"), createItem);
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
router.patch(
    "/:id/close",
    protect,
    authorize("staff", "admin"),
    closeItem
);
module.exports = router;