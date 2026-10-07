const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const itemRoutes = require("./routes/itemRoutes");
const claimRoutes = require("./routes/claimRoutes");
const matchRoutes = require("./routes/matchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const connectDB = require("./config/database");

const express = require("express");

const app = express();

const PORT = 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "CampusFind backend is running",
    });
});

app.use((req, res, next) => {
    const error = new Error("Route not found");
    error.statusCode = 404;
    next(error);
});

app.use(errorHandler);

connectDB();

app.listen(PORT, () => {
    console.log(`CampusFind backend running on http://localhost:${PORT}`);
});
