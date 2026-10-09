const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { successResponse } = require("../utils/apiResponse");

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-passwordHash");

        return successResponse(res, 200, "Users fetched successfully", users);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            errors: [],
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, department, phone } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (department !== undefined) {
            user.department = department;
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        await user.save();

        return successResponse(res, 200, "User updated successfully", {
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
        console.error("Update user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user",
            errors: [],
        });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!["student", "staff", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be student, staff, or admin",
                errors: [],
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        user.role = role;

        await user.save();

        return successResponse(res, 200, "User role updated successfully", {
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
        console.error("Update user role error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user role",
            errors: [],
        });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-passwordHash");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        return successResponse(res, 200, "Profile fetched successfully", user);
    } catch (error) {
        console.error("Get my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            errors: [],
        });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        const { name, department, phone } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (department !== undefined) {
            user.department = department;
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        await user.save();

        return successResponse(res, 200, "Profile updated successfully", {
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
        console.error("Update my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            errors: [],
        });
    }
};

const changeMyPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
                errors: [],
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters",
                errors: [],
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
                errors: [],
            });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);

        await user.save();

        return successResponse(
            res,
            200,
            "Password changed successfully"
        );
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change password",
            errors: [],
        });
    }
};

module.exports = {
    getUsers,
    updateUser,
    updateUserRole,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
};