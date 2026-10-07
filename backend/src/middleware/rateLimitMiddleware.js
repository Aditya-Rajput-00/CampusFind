const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        message: "Too many requests, please try again later.",
    },
});

module.exports = apiLimiter;
