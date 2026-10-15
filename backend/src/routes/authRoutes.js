const express = require("express");
const { register, login } = require("../controllers/authController");
const { validationResult } = require("express-validator");

const {
    registerValidator,
    loginValidator,
} = require("../validators/authValidator");

const router = express.Router();

// Validate incoming request data
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
 *   name: Authentication
 *   description: User registration and login
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: CampusFind Student
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ExamplePassword123
 *               department:
 *                 type: string
 *                 example: Computer Science
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or required fields are missing
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post(
    "/register",
    registerValidator,
    validateRequest,
    register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to CampusFind
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ExamplePassword123
 *     responses:
 *       200:
 *         description: Login successful; returns a JWT token and user details
 *       400:
 *         description: Invalid input or email and password are missing
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
router.post(
    "/login",
    loginValidator,
    validateRequest,
    login
);

module.exports = router;