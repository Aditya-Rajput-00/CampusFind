
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CampusFind API",
            version: "1.0.0",
            description:
                "API documentation for the CampusFind lost and found platform.",
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Local development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },

    apis: [
        path.resolve(__dirname, "../routes/authRoutes.js"),
        path.resolve(__dirname, "../routes/userRoutes.js"),
        path.resolve(__dirname, "../routes/itemRoutes.js"),
        path.resolve(__dirname, "../routes/claimRoutes.js"),
        path.resolve(__dirname, "../routes/matchRoutes.js"),
        path.resolve(__dirname, "../routes/notificationRoutes.js"),
        path.resolve(__dirname, "../routes/dashboardRoutes.js"),
        path.resolve(__dirname, "../server.js"),
    ],

};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
