const express = require("express");
const {
    getUsers,
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
 * /api/users/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's profile retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User profile not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", protect, getMyProfile);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get("/", protect, authorize("admin"), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user's details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid user ID or request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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
 *     summary: Update a user's role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, staff, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid user ID or role
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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
 *     summary: Update the current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid profile data
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch("/me", protect, updateMyProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   patch:
 *     summary: Change the current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Password validation failed
 *       401:
 *         description: Authentication required or current password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch(
    "/me/password",
    protect,
    changePasswordValidator,
    validateRequest,
    changeMyPassword
);

module.exports = router;