const DEFAULT_PAGE = 1;
const MAX_PAGE = 1000000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_OFFSET = 1000000;
const MAX_SEARCH_LENGTH = 100;

const createListQueryMiddleware = ({ filters = {} } = {}) => {
    const allowedParameters = new Set([
        "page",
        "limit",
        "search",
        ...Object.keys(filters),
    ]);

    return (req, res, next) => {
        const errors = [];

        for (const parameter of Object.keys(req.query)) {
            if (!allowedParameters.has(parameter)) {
                errors.push({
                    type: "field",
                    path: parameter,
                    msg: "Unsupported query parameter",
                    location: "query",
                });
            }
        }

        const parseInteger = (parameter, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
            const value = req.query[parameter];

            if (value === undefined) return fallback;

            if (typeof value !== "string" || !/^\d+$/.test(value)) {
                errors.push({
                    type: "field",
                    path: parameter,
                    msg: `${parameter} must be a positive integer`,
                    location: "query",
                    value,
                });
                return fallback;
            }

            const parsed = Number(value);
            if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
                errors.push({
                    type: "field",
                    path: parameter,
                    msg: `${parameter} must be between 1 and ${maximum}`,
                    location: "query",
                    value,
                });
                return fallback;
            }

            return parsed;
        };

        const page = parseInteger("page", DEFAULT_PAGE, MAX_PAGE);
        const limit = parseInteger("limit", DEFAULT_LIMIT, MAX_LIMIT);
        const offset = (page - 1) * limit;
        if (offset > MAX_OFFSET) {
            errors.push({
                type: "field",
                path: "page",
                msg: `page and limit cannot exceed an offset of ${MAX_OFFSET}`,
                location: "query",
                value: req.query.page,
            });
        }
        const searchValue = req.query.search;
        let search = "";

        if (searchValue !== undefined) {
            if (typeof searchValue !== "string" || searchValue.length > MAX_SEARCH_LENGTH) {
                errors.push({
                    type: "field",
                    path: "search",
                    msg: `search must be text no longer than ${MAX_SEARCH_LENGTH} characters`,
                    location: "query",
                    value: searchValue,
                });
            } else {
                search = searchValue.trim();
            }
        }

        const validatedFilters = {};
        for (const [parameter, allowedValues] of Object.entries(filters)) {
            const value = req.query[parameter];
            if (value === undefined) continue;

            if (typeof value !== "string" || !allowedValues.includes(value)) {
                errors.push({
                    type: "field",
                    path: parameter,
                    msg: `${parameter} has an unsupported value`,
                    location: "query",
                    value,
                });
            } else {
                validatedFilters[parameter] = value;
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        req.listQuery = { page, limit, offset, search, ...validatedFilters };
        return next();
    };
};

module.exports = createListQueryMiddleware;
