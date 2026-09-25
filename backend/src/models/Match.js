const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
    {
        lostItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true,
        },

        foundItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true,
        },

        matchScore: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },

        status: {
            type: String,
            enum: ["PENDING", "CONFIRMED", "REJECTED"],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Match", matchSchema);