const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sendPaginatedResponse = (
    res,
    statusCode,
    message,
    data,
    { page, limit, totalRecords }
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
        },
    });
};

module.exports = { escapeRegex, sendPaginatedResponse };
