const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ObjectId } = require('mongoose').Types;
const User = require('../models/user');
const { connectDB, getGfs } = require('../config/db');

// Configure multer for memory storage (PDF only)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to handle GridFS connection
const withGridFS = async (req, res, next) => {
    try {
        await connectDB();
        req.gfs = getGfs();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
};

router.get('/profile', withGridFS, async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        // Check if resume exists
        let hasResume = false;
        if (user.resumeId) {
            const file = await req.gfs.files.findOne({ _id: user.resumeId });
            hasResume = !!file; // Will be true if file exists
        }

        res.render('profile', {
            userData: user.toObject(),
            hasResume: hasResume, // Make sure this is passed
            title: 'User Profile - GoHire'
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).render('error', { message: 'Failed to load profile' });
    }
});

router.post('/resume', withGridFS, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded or invalid file type'
            });
        }

        const userId = req.session.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete existing resume if present
        if (user.resumeId) {
            await req.gfs.remove({ _id: user.resumeId, root: 'uploads' });
        }

        // Create write stream for GridFS
        const writeStream = req.gfs.createWriteStream({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            metadata: { userId }
        });

        writeStream.on('error', (error) => {
            console.error('GridFS write error:', error);
            throw error;
        });

        const file = await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
            writeStream.end(req.file.buffer);
        });

        user.resumeId = file._id;
        await user.save();

        res.json({
            success: true,
            message: 'Resume uploaded successfully',
            fileName: file.filename
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload resume',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
// Delete resume
router.delete('/resume', withGridFS, async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const user = await User.findOne({ userId });

        if (!user?.resumeId) {
            return res.status(404).json({ success: false, message: 'No resume found' });
        }

        await req.gfs.remove({ _id: user.resumeId, root: 'uploads' });
        user.resumeId = null;
        await user.save();

        res.json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete resume' });
    }
});

// Download resume
router.get('/resume', withGridFS, async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const user = await User.findOne({ userId });

        if (!user?.resumeId) {
            return res.status(404).send('No resume found');
        }

        const file = await req.gfs.files.findOne({ _id: user.resumeId });
        if (!file) {
            return res.status(404).send('File not found in storage');
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`
        });

        const readStream = req.gfs.createReadStream({ _id: file._id });
        readStream.on('error', () => res.status(404).send('File stream error'));
        readStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Failed to retrieve resume');
    }
});

module.exports = router;