
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const User = require("../models/User");
const { successResponse } = require("../utils/apiResponse");
const { escapeRegex, sendPaginatedResponse } = require("../utils/pagination");

const getUsers = async (req, res, next) => {
    try {
        const { page, limit, offset, search, role, accountStatus } = req.listQuery;
        const filter = { deletedAt: null };

        const conditions = [];
        if (search) {
            const expression = new RegExp(escapeRegex(search), "i");
            conditions.push({ $or: [{ name: expression }, { email: expression }] });
        }
        if (role) filter.role = role;
        if (accountStatus === "approved") {
            // Older records without accountStatus are treated as approved at login.
            conditions.push({ $or: [{ accountStatus: "approved" }, { accountStatus: null }] });
        } else if (accountStatus) {
            filter.accountStatus = accountStatus;
        }
        if (conditions.length === 1) {
            Object.assign(filter, conditions[0]);
        } else if (conditions.length > 1) {
            filter.$and = conditions;
        }

        const [users, totalRecords] = await Promise.all([
            User.find(filter)
                .select("_id name email role accountStatus department createdAt")
                .sort({ createdAt: -1, _id: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        const normalizedUsers = users.map((user) => ({
            ...user,
            accountStatus: user.accountStatus || "approved",
        }));

        return sendPaginatedResponse(
            res,
            200,
            "Users fetched successfully",
            normalizedUsers,
            { page, limit, totalRecords }
        );
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
            deletedAt: null,
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

// Get a safe, searchable, paginated list of staff accounts for administrators.
const getStaff = async (req, res, next) => {
    try {
        const { page, limit, offset, search, accountStatus } = req.listQuery;
        const filter = { role: "staff", deletedAt: null };

        const conditions = [];
        if (search) {
            const expression = new RegExp(escapeRegex(search), "i");
            conditions.push({ $or: [{ name: expression }, { email: expression }] });
        }
        if (accountStatus === "approved") {
            conditions.push({ $or: [{ accountStatus: "approved" }, { accountStatus: null }] });
        } else if (accountStatus) {
            filter.accountStatus = accountStatus;
        }
        if (conditions.length === 1) {
            Object.assign(filter, conditions[0]);
        } else if (conditions.length > 1) {
            filter.$and = conditions;
        }

        const [users, totalRecords] = await Promise.all([
            User.find(filter)
                .select("_id name email role accountStatus department phone createdAt")
                .sort({ createdAt: -1, _id: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        const normalizedUsers = users.map((user) => ({
            ...user,
            accountStatus: user.accountStatus || "approved",
        }));

        return sendPaginatedResponse(
            res,
            200,
            "Staff accounts fetched successfully",
            normalizedUsers,
            { page, limit, totalRecords }
        );
    } catch (error) {
        console.error("Get staff error:", error);
        return next(error);
    }
};

// Return only the approved student directory fields visible to staff.
const getApprovedStudents = async (req, res, next) => {
    try {
        const { page, limit, offset, search } = req.listQuery;
        const approvedFilter = {
            $or: [{ accountStatus: "approved" }, { accountStatus: null }],
        };
        const filter = { role: "student", deletedAt: null };

        if (search) {
            const expression = new RegExp(escapeRegex(search), "i");
            filter.$and = [
                { $or: [{ name: expression }, { email: expression }] },
                approvedFilter,
            ];
        } else {
            Object.assign(filter, approvedFilter);
        }

        const [students, totalRecords] = await Promise.all([
            User.find(filter)
                .select("name email department -_id")
                .sort({ createdAt: -1, _id: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        return sendPaginatedResponse(
            res,
            200,
            "Student directory fetched successfully",
            students,
            { page, limit, totalRecords }
        );
    } catch (error) {
        console.error("Get approved students error:", error);
        return next(error);
    }
};

// Retain user references in historical records while disabling and anonymizing the account.
const deleteUser = async (req, res, next) => {
    try {
        if (req.user.userId === req.params.id) {
            return res.status(409).json({
                success: false,
                message: "Administrators cannot delete their own account",
                errors: [],
            });
        }

        const user = await User.findById(req.params.id);
        if (!user || user.deletedAt) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                errors: [],
            });
        }

        if (!['student', 'staff'].includes(user.role)) {
            return res.status(409).json({
                success: false,
                message: "Administrator accounts are protected",
                errors: [],
            });
        }

        user.name = "Deleted account";
        user.email = `deleted-${user._id.toString()}@deleted.invalid`;
        user.passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
        user.accountStatus = "rejected";
        user.department = undefined;
        user.phone = undefined;
        user.deletedAt = new Date();
        await user.save();

        return successResponse(res, 200, "Account deleted successfully");
    } catch (error) {
        console.error("Delete user error:", error);
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
};
