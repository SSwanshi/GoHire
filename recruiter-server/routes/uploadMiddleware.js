const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config(); 

const storage = new GridFsStorage({
    url:process.env.MONGO_URI_RECRUITERS,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) return reject(err);
          
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'profileImages',
            metadata: {
              userId: req.params.userId // Store user ID with the file
            }
          };
          resolve(fileInfo);
        });
      });
    }
  });
  
  const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });
  
  module.exports = upload;