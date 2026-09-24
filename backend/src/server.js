const express = require("express");

const app = express();

const PORT = 5000;

app.get("/", (req, res) => {
    res.json({
        message: "CampusFind backend is running",
    });
});

app.listen(PORT, () => {
    console.log(`CampusFind backend running on http://localhost:${PORT}`);
});