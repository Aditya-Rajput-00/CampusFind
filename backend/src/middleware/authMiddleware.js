
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
            errors: [],
        });
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    // Step 1: Verify JWT
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            errors: [],
        });
    }

    // Step 2: Validate user ID
    if (!/^[a-f\d]{24}$/i.test(decoded.userId || "")) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            errors: [],
        });
    }

    // Step 3: Retrieve current user from database
    try {
        const user = await User.findById(decoded.userId);

        if (!user || user.accountStatus !== "approved") {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                errors: [],
            });
        }

        // Use current database values, not outdated JWT values.
        req.user = {
            userId: user._id.toString(),
            role: user.role,
        };

        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = protect;
