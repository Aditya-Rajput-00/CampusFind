
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { successResponse } = require("../utils/apiResponse");

const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-passwordHash");

        return successResponse(res, 200, "Users fetched successfully", users);
    } catch (error) {
        console.error("Get users error:", error);
        return next(error);
    }
};

// Get all staff accounts waiting for admin approval
const getPendingStaff = async (req, res, next) => {
    try {
        const users = await User.find({
            role: "staff",
            accountStatus: "pending",
        }).select("-passwordHash");

        return successResponse(
            res,
            200,
            "Pending staff registrations fetched successfully",
            users
        );
    } catch (error) {
        console.error("Get pending staff error:", error);
        return next(error);
    }
};

// Approve a pending staff account
const approveStaff = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        if (user.role !== "staff") {
            return res.status(400).json({
                success: false,
                message: "Only staff accounts can be approved",
                errors: [],
            });
        }

        if (user.accountStatus !== "pending") {
            return res.status(409).json({
                success: false,
                message: "This staff account is not pending approval",
                errors: [],
            });
        }

        user.accountStatus = "approved";
        await user.save();

        return successResponse(res, 200, "Staff account approved successfully", {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                department: user.department,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error("Approve staff error:", error);
        return next(error);
    }
};

// Reject a pending staff account
const rejectStaff = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        if (user.role !== "staff") {
            return res.status(400).json({
                success: false,
                message: "Only staff accounts can be rejected",
                errors: [],
            });
        }

        if (user.accountStatus !== "pending") {
            return res.status(409).json({
                success: false,
                message: "This staff account is not pending approval",
                errors: [],
            });
        }

        user.accountStatus = "rejected";
        await user.save();

        return successResponse(res, 200, "Staff account rejected successfully", {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                department: user.department,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error("Reject staff error:", error);
        return next(error);
    }
};

const updateUser = async (req, res, next) => {
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
        return next(error);
    }
};

const updateUserRole = async (req, res, next) => {
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
        return next(error);
    }
};

const getMyProfile = async (req, res, next) => {
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
        return next(error);
    }
};

const updateMyProfile = async (req, res, next) => {
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
        return next(error);
    }
};

const changeMyPassword = async (req, res, next) => {
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
        return next(error);
    }
};

module.exports = {
    getUsers,
    getPendingStaff,
    approveStaff,
    rejectStaff,
    updateUser,
    updateUserRole,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
};
