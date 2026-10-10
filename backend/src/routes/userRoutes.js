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

const router = express.Router();


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
 *         description: Failed to retrieve profile
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
 *         description: Failed to retrieve users
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
 *               email:
 *                 type: string
 *                 format: email
 *               department:
 *                 type: string
 *               year:
 *                 type: integer
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
 */
router.patch(
    "/:id",
    protect,
    authorize("admin"),
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
 */
router.patch(
    "/:id/role",
    protect,
    authorize("admin"),
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
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid profile data
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to update profile
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
 *         description: Current password is incorrect or new password is invalid
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to change password
 */
router.patch("/me/password", protect, changeMyPassword);

module.exports = router;