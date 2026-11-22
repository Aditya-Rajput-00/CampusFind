
const express = require("express");

const {
    getUsers,
    getPendingStaff,
    getStaff,
    getApprovedStudents,
    deleteUser,
    approveStaff,
    rejectStaff,
    updateUser,
    updateUserRole,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
} = require("../controllers/userController");

const createListQueryMiddleware = require("../middleware/listQueryMiddleware");

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
 *     description: Admin-only paginated user directory.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000000
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         description: Case-insensitive search in name and email.
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, staff, admin]
 *       - in: query
 *         name: accountStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
    "/",
    protect,
    authorize("admin"),
    createListQueryMiddleware({
        filters: {
            role: ["student", "staff", "admin"],
            accountStatus: ["pending", "approved", "rejected"],
        },
    }),
    getUsers
);

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
 * /api/users/staff:
 *   get:
 *     summary: Get staff accounts
 *     description: Admin-only searchable and paginated staff directory.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: accountStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000000
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Staff accounts fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
    "/staff",
    protect,
    authorize("admin"),
    createListQueryMiddleware({
        filters: {
            accountStatus: ["pending", "approved", "rejected"],
        },
    }),
    getStaff
);

/**
 * @swagger
 * /api/users/students:
 *   get:
 *     summary: Get the approved student directory
 *     description: Staff and administrators can search and page through approved student names, emails, and departments.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000000
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Student directory fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Staff or admin access required
 */
router.get(
    "/students",
    protect,
    authorize("staff", "admin"),
    createListQueryMiddleware(),
    getApprovedStudents
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Anonymize and disable a student or staff account
 *     description: Admins can delete student and staff accounts. Staff can delete student accounts only. Administrator accounts are protected.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       409:
 *         description: Account cannot be deleted
 */
router.delete(
    "/:id",
    protect,
    authorize("admin", "staff"),
    objectIdValidator,
    validateRequest,
    deleteUser
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
