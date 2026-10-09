
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { successResponse } = require("../utils/apiResponse");

const register = async (req, res) => {
    try {
        const { name, email, password, role, department, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
                errors: [],
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
                errors: [],
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role,
            department,
            phone,
        });

        return successResponse(res, 201, "User registered successfully", {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                phone: user.phone,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Registration failed",
            errors: [],
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
                errors: [],
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
                errors: [],
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
                errors: [],
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        return successResponse(res, 200, "Login successful", {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                phone: user.phone,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Login failed",
            errors: [],
        });
    }
};

module.exports = {
    register,
    login,
};
