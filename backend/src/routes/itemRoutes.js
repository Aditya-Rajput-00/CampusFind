
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

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get items with search, filtering, and pagination
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search item titles and descriptions
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [lost, found]
 *       - in: query
 *         name: building
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, MATCHED, CLAIMED, UNDER_VERIFICATION, VERIFIED, RETURNED, CLOSED]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Items fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Items fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [lost, found]
 *                           title:
 *                             type: string
 *                           category:
 *                             type: string
 *                           description:
 *                             type: string
 *                           location:
 *                             type: object
 *                             properties:
 *                               building:
 *                                 type: string
 *                               floor:
 *                                 type: number
 *                               area:
 *                                 type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           reportedBy:
 *                             type: object
 *                             description: Populated reporter name and email
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             enum: [ACTIVE, MATCHED, CLAIMED, UNDER_VERIFICATION, VERIFIED, RETURNED, CLOSED]
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         description: Failed to fetch items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", getItems);

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a lost or found item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - type
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *                 example: Black backpack
 *               description:
 *                 type: string
 *                 example: Black backpack found near the library
 *               category:
 *                 type: string
 *                 example: Bags
 *               type:
 *                 type: string
 *                 enum: [lost, found]
 *               location:
 *                 type: string
 *                 description: JSON-encoded location object containing building, floor, and area
 *                 example: '{"building":"Library","floor":2,"area":"Reading room"}'
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-09"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Validation failed or unsupported image type
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to create item
 */
router.post(
    "/",
    protect,
    handleUpload,
    createItemValidator,
    validateRequest,
    createItem
);

/**
 * @swagger
 * /api/items/{id}/status:
 *   patch:
 *     summary: Update an item's status
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, MATCHED, CLAIMED, UNDER_VERIFICATION, VERIFIED, RETURNED, CLOSED]
 *     responses:
 *       200:
 *         description: Item status updated successfully
 *       400:
 *         description: Invalid item ID or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 *       404:
 *         description: Item not found
 *       500:
 *         description: Failed to update item status
 */
router.patch(
    "/:id/status",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    validateRequest,
    updateItemStatus
);

/**
 * @swagger
 * /api/items/{id}/return:
 *   patch:
 *     summary: Mark a verified item as returned
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB item ID
 *     responses:
 *       200:
 *         description: Item marked as returned successfully
 *       400:
 *         description: Item cannot be returned in its current status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 *       404:
 *         description: Item not found
 *       500:
 *         description: Failed to return item
 */
router.patch(
    "/:id/return",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    validateRequest,
    returnItem
);

/**
 * @swagger
 * /api/items/{id}/close:
 *   patch:
 *     summary: Close a returned item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB item ID
 *     responses:
 *       200:
 *         description: Item closed successfully
 *       400:
 *         description: Item must be returned before it can be closed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 *       404:
 *         description: Item not found
 *       500:
 *         description: Failed to close item
 */
router.patch(
    "/:id/close",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    validateRequest,
    closeItem
);

module.exports = router;
