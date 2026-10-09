
const multer = require("multer");

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            const error = new Error("Only image files are allowed");
            error.statusCode = 400;
            error.errors = [];

            cb(error);
        }
    },
});

module.exports = upload;
