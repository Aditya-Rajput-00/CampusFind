const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["lost", "found"],
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            building: String,
            floor: Number,
            area: String,
        },

        date: {
            type: Date,
            required: true,
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: [
                "ACTIVE",
                "MATCHED",
                "CLAIMED",
                "UNDER_VERIFICATION",
                "VERIFIED",
                "RETURNED",
                "CLOSED",
            ],
            default: "ACTIVE",
        },

        images: [String],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Item", itemSchema);