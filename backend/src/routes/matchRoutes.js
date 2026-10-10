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
const { objectIdValidator } = require("../validators/objectIdValidator");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Matches
 *   description: Match management endpoints
 */

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Get all matches
 *     description: Retrieve matches for the authenticated user session.
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Matches fetched successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to fetch matches
 */
router.get("/", protect, getMatches);

/**
 * @swagger
 * /api/matches/pending:
 *   get:
 *     summary: Get pending matches
 *     description: Retrieve matches whose status is PENDING. Requires staff or admin access.
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending matches fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Failed to fetch pending matches
 */
router.get(
    "/pending",
    protect,
    authorize("staff", "admin"),
    getPendingMatches
);

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Create a match
 *     description: Create a match between a lost item and a found item, and notify both reporters.
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lostItemId
 *               - foundItemId
 *               - matchScore
 *             properties:
 *               lostItemId:
 *                 type: string
 *                 description: MongoDB ID of the lost item
 *                 example: "507f1f77bcf86cd799439011"
 *               foundItemId:
 *                 type: string
 *                 description: MongoDB ID of the found item
 *                 example: "507f1f77bcf86cd799439012"
 *               matchScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Match score between 0 and 100
 *                 example: 85
 *     responses:
 *       201:
 *         description: Match created successfully
 *       400:
 *         description: Required fields missing or match score invalid
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Lost or found item not found
 *       500:
 *         description: Failed to create match
 */
router.post(
    "/",
    protect,
    createMatchValidator,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        next();
    },
    createMatch
);

/**
 * @swagger
 * /api/matches/{id}/status:
 *   patch:
 *     summary: Update match status
 *     description: Confirm or reject a match. Requires staff or admin access.
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the match
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
 *                 enum: [CONFIRMED, REJECTED]
 *                 description: New match status
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Match status updated successfully
 *       400:
 *         description: Invalid status or match ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Match or related item not found
 *       500:
 *         description: Failed to update match status
 */
router.patch(
    "/:id/status",
    protect,
    authorize("staff", "admin"),
    objectIdValidator,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        next();
    },
    updateMatchStatus
);

module.exports = router;
