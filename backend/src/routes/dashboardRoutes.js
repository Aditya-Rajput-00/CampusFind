const express = require("express");
const { getDashboardStats } = require("../controllers/dashboardController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics endpoints
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve system-wide statistics. Requires staff or admin access.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
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
 *                   example: Dashboard statistics fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       description: Total number of registered users
 *                       example: 120
 *                     totalItems:
 *                       type: integer
 *                       description: Total number of reported items
 *                       example: 85
 *                     lostItems:
 *                       type: integer
 *                       description: Number of items with type lost
 *                       example: 40
 *                     foundItems:
 *                       type: integer
 *                       description: Number of items with type found
 *                       example: 45
 *                     activeItems:
 *                       type: integer
 *                       description: Number of items with status ACTIVE
 *                       example: 30
 *                     returnedItems:
 *                       type: integer
 *                       description: Number of items with status RETURNED
 *                       example: 15
 *                     pendingClaims:
 *                       type: integer
 *                       description: Number of claims awaiting a decision
 *                       example: 8
 *                     pendingMatches:
 *                       type: integer
 *                       description: Number of matches with status PENDING
 *                       example: 5
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin role required
 *       500:
 *         description: Failed to fetch dashboard statistics
 */
router.get(
    "/stats",
    protect,
    authorize("staff", "admin"),
    getDashboardStats
);

module.exports = router;
