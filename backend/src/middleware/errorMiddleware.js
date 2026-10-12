
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    console.error(err.stack || err);

    const requestedStatus = Number(err.statusCode || err.status);
    const statusCode =
        Number.isInteger(requestedStatus) &&
            requestedStatus >= 400 &&
            requestedStatus <= 599
            ? requestedStatus
            : 500;

    const isServerError = statusCode >= 500;

    const message = isServerError
        ? "Internal server error"
        : err.message || "Request failed";

    const errors = Array.isArray(err.errors) ? err.errors : [];

    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};

module.exports = errorHandler;
