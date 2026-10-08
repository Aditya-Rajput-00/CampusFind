const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { successResponse } = require("../utils/apiResponse");

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-passwordHash");

        return successResponse(res, 200, "Users fetched successfully", users);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch users",
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, department, phone } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
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

        res.status(500).json({
            message: "Failed to update user",
        });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!["student", "staff", "admin"].includes(role)) {
            return res.status(400).json({
                message: "Role must be student, staff, or admin",
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
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

        res.status(500).json({
            message: "Failed to update user role",
        });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-passwordHash");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return successResponse(res, 200, "Profile fetched successfully", user);
    } catch (error) {
        console.error("Get my profile error:", error);

        res.status(500).json({
            message: "Failed to fetch profile",
        });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        const { name, department, phone } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
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

        res.status(500).json({
            message: "Failed to update profile",
        });
    }
};

const changeMyPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must be at least 8 characters",
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Current password is incorrect",
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

        res.status(500).json({
            message: "Failed to change password",
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