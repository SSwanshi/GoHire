const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ObjectId } = require('mongoose').Types;
const User = require('../models/user');
const { connectDB, getGfs } = require('../config/db');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowedTypes.includes(ext));
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

// Get current user profile
router.get('/profile', withGridFS, async (req, res) => {
    try {
        const userId = req.session.user?.id || 'guest';
        const user = await User.findOneOrCreate({ userId }, {
            userId,
            firstName: 'Anuj',
            lastName: 'Rathore',
            email: 'anujrathore385@gmail.com',
            phone: '9340041042',
            gender: 'Male',
            memberSince: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        });

        const userData = user.toObject();
        let resumeData = null;

        if (user.resumeId) {
            const file = await req.gfs.files.findOne({ _id: user.resumeId });
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
        console.error('Profile error:', error);
        res.status(500).render('error', { message: 'Failed to load profile' });
    }
});

// Upload resume
router.post('/resume', withGridFS, upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded or invalid file type'
        });
    }

    try {
        const userId = req.session.user?.id || 'guest';
        const user = await User.findOne({ userId }) || new User({ userId });

        // Delete existing resume if present
        if (user.resumeId) {
            await req.gfs.remove({ _id: user.resumeId, root: 'uploads' });
        }

        // Create write stream for GridFS
        const writeStream = req.gfs.createWriteStream({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            metadata: {
                userId,
                title: req.body.resumeTitle || req.file.originalname
            }
        });

        writeStream.on('error', error => {
            throw new Error(`GridFS write error: ${error.message}`);
        });

        writeStream.on('finish', async (file) => {
            user.resumeId = file._id;
            await user.save();

            res.status(201).json({
                success: true,
                message: 'Resume uploaded successfully',
                resumeData: {
                    fileName: file.filename,
                    uploadDate: file.uploadDate,
                    fileSize: file.length,
                    mimeType: file.contentType,
                    title: file.metadata?.title
                }
            });
        });

        writeStream.end(req.file.buffer);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload resume'
        });
    }
});

// Delete resume
router.delete('/resume', withGridFS, async (req, res) => {
    try {
        const userId = req.session.user?.id || 'guest';
        const user = await User.findOne({ userId });

        if (!user?.resumeId) {
            return res.status(404).json({
                success: false,
                message: 'No resume found to delete'
            });
        }

        await req.gfs.remove({ _id: user.resumeId, root: 'uploads' });
        user.resumeId = null;
        await user.save();

        res.json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete resume'
        });
    }
});

// Download resume
router.get('/resume/:userId', withGridFS, async (req, res) => {
    try {
        const userId = req.params.userId;

        if (req.session.user?.id !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const user = await User.findOne({ userId });
        if (!user?.resumeId) {
            return res.status(404).send('No resume found');
        }

        const file = await req.gfs.files.findOne({ _id: user.resumeId });
        if (!file) {
            return res.status(404).send('File not found in storage');
        }

        res.set({
            'Content-Type': file.contentType,
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