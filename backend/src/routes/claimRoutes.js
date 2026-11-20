
const express = require("express");
const {
    getClaims,
    getPendingClaims,
    getVerificationQueue,
    createClaim,
    updateClaimStatus,
    verifyClaim,
} = require("../controllers/claimController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { objectIdValidator } = require("../validators/objectIdValidator");
const createListQueryMiddleware = require("../middleware/listQueryMiddleware");
const { validationResult } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /api/claims:
 *   get:
 *     summary: Get claims
 *     description: Retrieve paginated claims with associated items and claimant details. Students only see their own claims.
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, maximum: 1000000, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: search
 *         description: Searches claim proof, item title, claimant name, and claimant email (up to 100 characters).
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, CANCELLED] }
 *     responses:
 *       200:
 *         description: Claims fetched successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to fetch claims
 */
router.get(
    "/",
    protect,
    createListQueryMiddleware({
        filters: {
            status: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
        },
    }),
    getClaims
);

/**
 * @swagger
 * /api/claims/pending:
 *   get:
 *     summary: Get pending claims
 *     description: Retrieve claims awaiting a decision. Staff or admin access is required.
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, maximum: 1000000, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *     responses:
 *       200:
 *         description: Pending claims fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 *       500:
 *         description: Failed to fetch pending claims
 */
router.get(
    "/pending",
    protect,
    authorize("staff", "admin"),
    createListQueryMiddleware(),
    getPendingClaims
);

/**
 * @swagger
 * /api/claims/verification-queue:
 *   get:
 *     summary: Get the claim verification queue
 *     description: Retrieve approved claims that have not yet been verified. Staff or admin access is required.
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, maximum: 1000000, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *     responses:
 *       200:
 *         description: Verification queue fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 *       500:
 *         description: Failed to fetch verification queue
 */
router.get(
    "/verification-queue",
    protect,
    authorize("staff", "admin"),
    createListQueryMiddleware(),
    getVerificationQueue
);

/**
 * @swagger
 * /api/claims:
 *   post:
 *     summary: Submit a claim for an item
 *     description: Create a claim for an existing item using a description of ownership proof.
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - proof
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: MongoDB ID of the item being claimed
 *               proof:
 *                 type: object
 *                 required:
 *                   - description
 *                 properties:
 *                   description:
 *                     type: string
 *                     example: I can identify a unique keychain inside the bag.
 *                   additionalDetails:
 *                     type: string
 *                     example: The bag has a blue tag attached to the zipper.
 *     responses:
 *       201:
 *         description: Claim created successfully
 *       400:
 *         description: Item ID or proof description is missing
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Item not found
 *       500:
 *         description: Failed to create claim
 */
router.post("/", protect, createClaim);

/**
 * @swagger
 * /api/claims/{id}/status:
 *   patch:
 *     summary: Approve or reject a claim
 *     description: Staff or admin users can update a claim's decision status.
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB claim ID
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
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Claim status updated successfully
 *       400:
 *         description: Status must be APPROVED or REJECTED, or claim ID is invalid
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 *       404:
 *         description: Claim or related item not found
 *       500:
 *         description: Failed to update claim status
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
    updateClaimStatus
);

/**
 * @swagger
 * /api/claims/{id}/verify:
 *   patch:
 *     summary: Record claim ownership verification
 *     description: Staff or admin users can record the verification result and optional notes.
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB claim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - result
 *             properties:
 *               result:
 *                 type: string
 *                 enum: [SUCCESS, FAILURE]
 *               notes:
 *                 type: string
 *                 description: Optional verification notes
 *     responses:
 *       200:
 *         description: Verification result recorded successfully
 *       400:
 *         description: Result must be SUCCESS or FAILURE, or claim ID is invalid
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 *       404:
 *         description: Claim not found
 *       500:
 *         description: Failed to verify claim
 */
router.patch(
    "/:id/verify",
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
    verifyClaim
);

module.exports = router;
