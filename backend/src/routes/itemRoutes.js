
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
const { objectIdValidator } = require("../validators/objectIdValidator");

const router = express.Router();

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }

    next();
};

const handleUpload = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: [],
            });
        }

        if (error) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "File upload failed",
                errors: error.errors || [],
            });
        }

        next();
    });
};

router.get("/", getItems);

router.post(
    "/",
    protect,
    createItemValidator,
    validateRequest,
    handleUpload,
    createItem
);

router.patch(
    "/:id/status",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    validateRequest,
    updateItemStatus
);

router.patch(
    "/:id/return",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    validateRequest,
    returnItem
);

router.patch(
    "/:id/close",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    validateRequest,
    closeItem
);

module.exports = router;
