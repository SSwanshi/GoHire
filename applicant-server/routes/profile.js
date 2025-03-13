const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// In-memory storage for user resumes (Replace with database)
const userResumes = {};

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const userId = req.session.user?.id || 'guest';
        cb(null, `${userId}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

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
router.get('/profile', (req, res) => {
    const userId = req.session.user?.id || 'guest';

    const userData = {
        firstName: 'Anuj',
        lastName: 'Rathore',
        email: 'anujrathore385@gmail.com',
        phone: '9340041042',
        gender: 'Male',
        memberSince: 'March 2025'
    };

    const resumeData = userResumes[userId];

    res.render('profile', {
        userData,
        resumeData,
        title: 'User Profile - GoHire'
    });
});

// Resume Upload Route
router.post('/resume', upload.single('resume'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.session.user?.id || 'guest';

        if (userResumes[userId] && userResumes[userId].filePath) {
            try {
                fs.unlinkSync(userResumes[userId].filePath);
            } catch (err) {
                console.error('Error deleting old resume:', err);
            }
        }

        userResumes[userId] = {
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadDate: new Date().toISOString(),
            title: req.body.resumeTitle || req.file.originalname
        };

        res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully',
            resumeData: userResumes[userId]
        });

    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resume Deletion Route
router.delete('/resume', (req, res) => {
    try {
        const userId = req.session.user?.id || 'guest';

        if (!userResumes[userId]) {
            return res.status(404).json({ success: false, message: 'No resume found' });
        }

        try {
            fs.unlinkSync(userResumes[userId].filePath);
        } catch (err) {
            console.error('Error deleting resume file:', err);
        }

        delete userResumes[userId];

        res.status(200).json({ success: true, message: 'Resume deleted successfully' });

    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resume Download Route
router.get('/resume/:userId', (req, res) => {
    try {
        const userId = req.params.userId;

        if (req.session.user?.id !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const resumeData = userResumes[userId];

        res.setHeader('Content-Type', resumeData.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${resumeData.fileName}"`);
        res.sendFile(path.resolve(resumeData.filePath));

    } catch (error) {
        console.error('Error serving resume:', error);
        res.status(500).send('Error retrieving resume');
    }
});

module.exports = router;
