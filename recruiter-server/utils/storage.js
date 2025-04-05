const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI_RECRUITERS;

// Initialize GridFS storage with error handling
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true }, // Ensure stable MongoDB connection
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Validate file existence
      if (!file) {
        return reject(new Error("No file provided"));
      }

      // Optional: Restrict file types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.mimetype)) {
        return reject(new Error("Invalid file type. Only JPEG, PNG, and JPG allowed."));
      }

      // Define file info for GridFS
      const filename = `profile_${Date.now()}_${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'profileImages'
      };
      resolve(fileInfo);
    });
  }
});

// Configure Multer with error handling
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

module.exports = upload;