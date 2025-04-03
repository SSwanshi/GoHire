const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
require("dotenv").config();

const storage = new GridFsStorage({
    url: process.env.MONGO_URI_APPLICANTS, 
    file: (req, file) => {
        return {
            filename: `${Date.now()}-${file.originalname}`,
            bucketName: "uploads", 
        };
    },
});

const upload = multer({ storage });

module.exports = upload;
