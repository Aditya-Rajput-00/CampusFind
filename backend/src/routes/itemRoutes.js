const express = require("express");
const multer = require("multer");
const {
    getItems,
    createItem,
    updateItemStatus,
    returnItem,
    closeItem,
} = require("../controllers/itemController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { createItemValidator } = require("../validators/itemValidator");
const { validationResult } = require("express-validator");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getItems);
router.post(
    "/",
    protect,
    createItemValidator,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        upload.single("image")(req, res, (error) => {
            if (error instanceof multer.MulterError) {
                return res.status(400).json({
                    message: error.message,
                });
            }

            if (error) {
                return res.status(400).json({
                    message: error.message,
                });
            }

            next();
        });
    },
    createItem
);

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