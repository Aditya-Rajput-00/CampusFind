
const Item = require("../models/Item");
const Match = require("../models/Match");
const Notification = require("../models/Notification");

// Centralized matching configuration
const MATCH_CONFIG = {
    threshold: 60,

    weights: {
        title: 35,
        category: 25,
        description: 25,
        location: 15,
    },

    locationWeights: {
        building: 7,
        area: 5,
        floor: 3,
    },
};

// Normalize text before comparison
const normalizeText = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// Calculate similarity using Dice coefficient
const calculateTextSimilarity = (first, second) => {
    const textA = normalizeText(first);
    const textB = normalizeText(second);

    if (!textA || !textB) {
        return 0;
    }

    if (textA === textB) {
        return 1;
    }

    const wordsA = new Set(textA.split(" "));
    const wordsB = new Set(textB.split(" "));

    const intersection = [...wordsA].filter((word) =>
        wordsB.has(word)
    ).length;

    return (2 * intersection) / (wordsA.size + wordsB.size);
};

// Compare location fields using configured weights
const calculateLocationSimilarity = (first, second) => {
    const locationA = first.location || {};
    const locationB = second.location || {};

    const fields = [
        {
            key: "building",
            weight: MATCH_CONFIG.locationWeights.building,
            similarity: (a, b) => calculateTextSimilarity(a, b),
        },
        {
            key: "area",
            weight: MATCH_CONFIG.locationWeights.area,
            similarity: (a, b) => calculateTextSimilarity(a, b),
        },
        {
            key: "floor",
            weight: MATCH_CONFIG.locationWeights.floor,
            similarity: (a, b) =>
                Number(a) === Number(b) ? 1 : 0,
        },
    ];

    let score = 0;

    for (const field of fields) {
        const valueA = locationA[field.key];
        const valueB = locationB[field.key];

        if (
            valueA === undefined ||
            valueA === null ||
            valueB === undefined ||
            valueB === null ||
            valueA === "" ||
            valueB === ""
        ) {
            continue;
        }

        score += field.weight * field.similarity(valueA, valueB);
    }

    return score;
};

// Calculate total match score out of 100
const calculateMatchScore = (first, second) => {
    const weights = MATCH_CONFIG.weights;

    const titleScore =
        calculateTextSimilarity(first.title, second.title) *
        weights.title;

    // Award category points only when both categories are non-empty
    const firstCategory = normalizeText(first.category);
    const secondCategory = normalizeText(second.category);

    const categoryScore =
        firstCategory &&
            secondCategory &&
            firstCategory === secondCategory
            ? weights.category
            : 0;

    const descriptionScore =
        calculateTextSimilarity(first.description, second.description) *
        weights.description;

    const locationScore = calculateLocationSimilarity(first, second);

    return Math.round(
        titleScore + categoryScore + descriptionScore + locationScore
    );
};

// Find opposite-type active reports
const findMatchingCandidates = async (item) => {
    const oppositeType = item.type === "lost" ? "found" : "lost";

    return Item.find({
        _id: { $ne: item._id },
        type: oppositeType,
        status: "ACTIVE",
    });
};

// Create automatic matches and notify both reporters
const findAndCreateMatches = async (item) => {
    if (!item || !["lost", "found"].includes(item.type)) {
        return [];
    }

    const candidates = await findMatchingCandidates(item);
    const createdMatches = [];

    for (const candidate of candidates) {
        const lostItem = item.type === "lost" ? item : candidate;
        const foundItem = item.type === "found" ? item : candidate;

        const matchScore = calculateMatchScore(lostItem, foundItem);

        if (matchScore < MATCH_CONFIG.threshold) {
            continue;
        }

        let match;

        try {
            match = await Match.create({
                lostItemId: lostItem._id,
                foundItemId: foundItem._id,
                matchScore,
            });
        } catch (error) {
            // Ignore duplicate pairs
            if (error.code === 11000) {
                continue;
            }

            throw error;
        }

        createdMatches.push(match);

        // Notify both reporters independently
        const notifications = [
            {
                userId: lostItem.reportedBy,
                type: "MATCH",
                title: "Potential Match Found",
                message: `A potential match was found for your lost item: ${lostItem.title}.`,
            },
            {
                userId: foundItem.reportedBy,
                type: "MATCH",
                title: "Potential Match Found",
                message: `A potential match was found for your found item: ${foundItem.title}.`,
            },
        ];

        for (const notification of notifications) {
            try {
                await Notification.create(notification);
            } catch (error) {
                console.error(
                    "Automatic match notification error:",
                    error
                );
            }
        }
    }

    return createdMatches;
};

module.exports = {
    MATCH_CONFIG,
    normalizeText,
    calculateTextSimilarity,
    calculateLocationSimilarity,
    calculateMatchScore,
    findMatchingCandidates,
    findAndCreateMatches,
};
