
const express = require("express");

const {
    getUsers,
    getPendingStaff,
    approveStaff,
    rejectStaff,
    updateUser,
    updateUserRole,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { objectIdValidator } = require("../validators/objectIdValidator");
const { validationResult } = require("express-validator");
const {
    changePasswordValidator,
} = require("../validators/passwordValidator");

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

    return next();
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and account management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", protect, getMyProfile);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Admin-only endpoint to retrieve users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/", protect, authorize("admin"), getUsers);

/**
 * @swagger
 * /api/users/pending-staff:
 *   get:
 *     summary: Get pending staff registrations
 *     description: Admin-only endpoint to retrieve staff accounts awaiting approval.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending staff registrations fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
    "/pending-staff",
    protect,
    authorize("admin"),
    getPendingStaff
);

/**
 * @swagger
 * /api/users/{id}/approve:
 *   patch:
 *     summary: Approve a staff registration
 *     description: Admin-only endpoint to approve a pending staff account.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff user's MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Staff account approved successfully
 *       400:
 *         description: Invalid account status or user role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       409:
 *         description: Account is not pending
 */
router.patch(
    "/:id/approve",
    protect,
    authorize("admin"),
    objectIdValidator,
    validateRequest,
    approveStaff
);

/**
 * @swagger
 * /api/users/{id}/reject:
 *   patch:
 *     summary: Reject a staff registration
 *     description: Admin-only endpoint to reject a pending staff account.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff user's MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Staff account rejected successfully
 *       400:
 *         description: Invalid account status or user role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       409:
 *         description: Account is not pending
 */
router.patch(
    "/:id/reject",
    protect,
    authorize("admin"),
    objectIdValidator,
    validateRequest,
    rejectStaff
);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user details
 *     description: Admin-only endpoint to update a user's details.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's MongoDB ObjectId
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch(
    "/:id",
    protect,
    authorize("admin"),
    objectIdValidator,
    validateRequest,
    updateUser
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     description: Admin-only endpoint to change a user's role.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's MongoDB ObjectId
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch(
    "/:id/role",
    protect,
    authorize("admin"),
    objectIdValidator,
    validateRequest,
    updateUserRole
);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch("/me", protect, updateMyProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   patch:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
router.patch(
    "/me/password",
    protect,
    changePasswordValidator,
    validateRequest,
    changeMyPassword
);

module.exports = router;
