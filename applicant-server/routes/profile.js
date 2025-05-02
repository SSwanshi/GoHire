const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/user');
const { connectDB, getGfs } = require('../config/db');

// Add authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user?.authenticated) {
        return res.redirect('/login');
    }
    next();
};


// Simple multer memory storage for PDFs only
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get profile page
// Update profile route
router.get('/', requireAuth, async (req, res) => {
    try {
        // Use userId consistently (matches what we set in login)
        const user = await User.findOne({ userId: req.session.user.id });

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        let resumeName = null;
        if (user.resumeId) {
            const gfs = getGfs();
            const file = await gfs.files.findOne({ _id: user.resumeId });
            if (file) resumeName = file.filename;
        }

        res.render('profile', {
            user,
            resumeName,
            title: 'User Profile'
        });

    } catch (error) {
        console.error('Profile error:', error);
        req.session.destroy();
        res.redirect('/login');
    }
});

// Upload resume
router.post('/resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded');
        if (!req.session.user?.id) return res.status(401).send('Not logged in');

        const user = await User.findOne({ userId: req.session.user.id });
        if (!user) return res.status(404).send('User not found');

        const gfs = getGfs();

        // Delete old resume if exists
        if (user.resumeId) {
            await gfs.remove({ _id: user.resumeId, root: 'uploads' });
        }

        // Store new resume
        const writeStream = gfs.createWriteStream({
            filename: req.file.originalname,
            contentType: 'application/pdf'
        });

        writeStream.end(req.file.buffer);

        writeStream.on('finish', async (file) => {
            user.resumeId = file._id;
            await user.save();
            res.redirect('/profile');
        });

        writeStream.on('error', (err) => {
            throw err;
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Upload failed');
    }
});

// View resume
router.get('/resume', async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).send('Not logged in');

        const user = await User.findOne({ userId });
        if (!user?.resumeId) return res.status(404).send('No resume found');

        const gfs = getGfs();
        const file = await gfs.files.findOne({ _id: user.resumeId });
        if (!file) return res.status(404).send('File not found');

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);

        const readStream = gfs.createReadStream({ _id: file._id });
        readStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error downloading resume');
    }
});

// Delete resume
router.post('/resume/delete', async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) return res.status(401).send('Not logged in');

        const user = await User.findOne({ userId });
        if (!user?.resumeId) return res.status(404).send('No resume found');

        const gfs = getGfs();
        await gfs.remove({ _id: user.resumeId, root: 'uploads' });

        user.resumeId = null;
        await user.save();

        res.redirect('/profile');
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).send('Error deleting resume');
    }
});

module.exports = router;