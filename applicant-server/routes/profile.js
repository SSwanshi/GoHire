const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { ObjectId } = mongoose.Types;
const User = require('../models/user'); // Import your User model

const { connectDB, getGfs } = require('../config/db');

// Multer storage setup for GridFS
const storage = multer.memoryStorage(); // Store file in memory before uploading to GridFS

// File upload filter
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Render Profile Page
router.get('/profile', async (req, res) => {
    try {
        // Connect to DB and get GridFS instance
        await connectDB();
        const gfs = getGfs();
        const userId = req.session.user?.id || 'guest';

        // Find or create user in MongoDB
        let user = await User.findOne({ userId });

        if (!user) {
            // Create a new user with default data
            user = new User({
                userId,
                firstName: 'Anuj',
                lastName: 'Rathore',
                email: 'anujrathore385@gmail.com',
                phone: '9340041042',
                gender: 'Male',
                memberSince: 'March 2025'
            });
            await user.save();
        }

        // Extract user data
        const userData = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            memberSince: user.memberSince
        };

        // Get resume data if exists
        let resumeData = null;
        if (user.resumeId) {
            const file = await gfs.files.findOne({ _id: user.resumeId });
            if (file) {
                resumeData = {
                    fileName: file.filename,
                    uploadDate: file.uploadDate,
                    fileSize: file.length,
                    mimeType: file.contentType,
                    title: file.metadata?.title || file.filename
                };
            }
        }

        res.render('profile', {
            userData,
            resumeData,
            title: 'User Profile - GoHire'
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Resume Upload Route
router.post('/resume', upload.single('resume'), async (req, res) => {
    try {
        // Connect to DB and get GridFS instance
        await connectDB();
        const gfs = getGfs();
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.session.user?.id || 'guest';

        // Find user in MongoDB
        let user = await User.findOne({ userId });

        if (!user) {
            user = new User({ userId });
        }

        // If user already has a resume, delete the old one
        if (user.resumeId) {
            try {
                await gfs.remove({ _id: user.resumeId, root: 'uploads' });
            } catch (err) {
                console.error('Error deleting old resume:', err);
            }
        }

        // Create write stream for GridFS
        const writeStream = gfs.createWriteStream({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            metadata: {
                userId: userId,
                title: req.body.resumeTitle || req.file.originalname
            }
        });

        writeStream.on('error', (error) => {
            throw error;
        });

        writeStream.on('finish', async (file) => {
            // Update user with new resume ID
            user.resumeId = file._id;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Resume uploaded successfully',
                resumeData: {
                    fileName: file.filename,
                    uploadDate: file.uploadDate,
                    fileSize: file.length,
                    mimeType: file.contentType,
                    title: file.metadata?.title || file.filename
                }
            });
        });

        // Write file to GridFS
        writeStream.end(req.file.buffer);

    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resume Deletion Route
router.delete('/resume', async (req, res) => {
    try {
        // Connect to DB and get GridFS instance
        await connectDB();
        const gfs = getGfs();
        const userId = req.session.user?.id || 'guest';

        const user = await User.findOne({ userId });
        if (!user || !user.resumeId) {
            return res.status(404).json({ success: false, message: 'No resume found' });
        }

        // Delete the file from GridFS
        try {
            await gfs.remove({ _id: user.resumeId, root: 'uploads' });
        } catch (err) {
            console.error('Error deleting resume file:', err);
        }

        // Remove the resume reference from user
        user.resumeId = null;
        await user.save();

        res.status(200).json({ success: true, message: 'Resume deleted successfully' });

    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resume Download Route
router.get('/resume/:userId', async (req, res) => {
    try {
        // Connect to DB and get GridFS instance
        await connectDB();
        const gfs = getGfs();
        const userId = req.params.userId;

        if (req.session.user?.id !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const user = await User.findOne({ userId });
        if (!user || !user.resumeId) {
            return res.status(404).send('No resume found');
        }

        const file = await gfs.files.findOne({ _id: user.resumeId });
        if (!file) {
            return res.status(404).send('File not found');
        }

        // Set appropriate headers
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);

        // Create read stream and pipe to response
        const readStream = gfs.createReadStream({ _id: file._id });
        readStream.on('error', () => res.status(404).send('File not found'));
        readStream.pipe(res);

    } catch (error) {
        console.error('Error serving resume:', error);
        res.status(500).send('Error retrieving resume');
    }
});

module.exports = router;