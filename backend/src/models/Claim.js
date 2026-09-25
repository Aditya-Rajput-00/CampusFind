const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true,
        },

        claimantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        proof: {
            description: {
                type: String,
                required: true,
                trim: true,
            },

            additionalDetails: {
                type: String,
                trim: true,
            },
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Claim", claimSchema);