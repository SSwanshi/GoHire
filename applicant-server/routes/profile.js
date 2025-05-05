const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/user');
const { connectDB, getBucket } = require('../config/db');
const { ObjectId } = require('mongodb');
const Job = require('../models/recruiter/Job');
const Internship = require('../models/recruiter/Internships'); // Add this if you have an Internship model
const connectRecruiterDB = require('../config/recruiterDB'); // Assuming you have a separate DB connection for recruiters

const createJobModel = require('../models/recruiter/Job');
const createInternshipModel = require('../models/recruiter/Internships');
const createCompanyModel = require('../models/recruiter/Company');
const AppliedJob = require('../models/Applied_for_Jobs');
const AppliedInternship = require('../models/Applied_for_Internships');

const JobModel = require('../models/recruiter/Job');
const InternshipModel = require('../models/recruiter/Internships');
const CompanyModel = require('../models/recruiter/Company');
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

// ... (previous imports remain the same)

router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.session.user.id });
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        let resumeName = null;
        if (user.resumeId) {
            const bucket = getBucket();
            const files = await bucket.find({ _id: new ObjectId(user.resumeId) }).toArray();
            if (files.length > 0) resumeName = files[0].filename;
        }

        const jobApplications = await AppliedJob.find({ userId: req.session.user.id });
        const internshipApplications = await AppliedInternship.find({ userId: req.session.user.id });

        // console.log('Job Applications:', jobApplications);
        // console.log('Internship Applications:', internshipApplications);

        // Get all unique job/internship IDs
        const jobIds = [...new Set(jobApplications.map(app => app.jobId).filter(Boolean))];
        const internshipIds = [...new Set(internshipApplications.map(app => app.internshipId).filter(Boolean))];

        // // Connect to recruiter DB
        const recruiterConn = await connectRecruiterDB();

        // // IMPORTANT: Get the original schemas from the models


        // // Create models using the recruiterDB connection
        const JobFindConn = createJobModel(recruiterConn);
        const InternshipFindConn = createInternshipModel(recruiterConn);
        const CompanyFindConn = createCompanyModel(recruiterConn);

        // Fetch details from recruiter DB
        const [jobs, internships] = await Promise.all([
            jobIds.length > 0 ? JobFindConn.find({ _id: { $in: jobIds } }).populate('jobCompany', 'companyName') : [],
            internshipIds.length > 0 ? InternshipFindConn.find({ _id: { $in: internshipIds } }).populate('intCompany', 'companyName') : []
        ]);
        // console.log('Jobs:', jobs);
        // console.log('Internships:', internships);

        // Create lookup maps
        const jobMap = jobs.reduce((map, job) => (map[job._id] = job, map), {});
        const internshipMap = internships.reduce((map, internship) => (map[internship._id] = internship, map), {});

        console.log('Job Map:', jobMap);
        console.log('Internship Map:', internshipMap);

        // Format application history
        const applicationHistory = [
            ...jobApplications.map(app => {
                const job = app.jobId ? jobMap[app.jobId] : null;
                return {
                    type: 'Job',
                    title: job?.jobTitle || 'Job No Longer Available',
                    company: job?.jobCompany?.companyName || 'Company No Longer Available',
                    appliedAt: app.AppliedAt,
                    status: app.isSelected ? 'Accepted' : app.isRejected ? 'Rejected' : 'Pending',
                    applicationId: app._id
                };
            }),
            ...internshipApplications.map(app => {
                const internship = app.internshipId ? internshipMap[app.internshipId] : null;
                return {
                    type: 'Internship',
                    title: internship?.intTitle || 'Internship No Longer Available',
                    company: internship?.intCompany?.companyName || 'Company No Longer Available',
                    appliedAt: app.AppliedAt,
                    status: app.isSelected ? 'Accepted' : app.isRejected ? 'Rejected' : 'Pending',
                    applicationId: app._id
                };
            })
        ];

        // Sort by date (newest first)
        applicationHistory.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        res.render('profile', {
            user,
            resumeName,
            applicationHistory,
            title: 'User Profile'
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.redirect('/login');
    }
});

// ... (rest of the file remains the same)
// Upload resume
router.post('/resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded');
        if (!req.session.user?.id) return res.status(401).send('Not logged in');

        const user = await User.findOne({ userId: req.session.user.id });
        if (!user) return res.status(404).send('User not found');

        const bucket = getBucket();

        // Delete old resume if exists
        if (user.resumeId) {
            await bucket.delete(new ObjectId(user.resumeId));
        }

        // Store new resume
        const uploadStream = bucket.openUploadStream(req.file.originalname, {
            contentType: 'application/pdf'
        });

        uploadStream.end(req.file.buffer);

        uploadStream.on('finish', async () => {
            user.resumeId = uploadStream.id;
            await user.save();
            res.redirect('/profile');
        });

        uploadStream.on('error', (err) => {
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

        const bucket = getBucket();
        const files = await bucket.find({ _id: new ObjectId(user.resumeId) }).toArray();
        if (files.length === 0) return res.status(404).send('File not found');

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${files[0].filename}"`);

        const downloadStream = bucket.openDownloadStream(new ObjectId(user.resumeId));
        downloadStream.pipe(res);
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

        const bucket = getBucket();
        await bucket.delete(new ObjectId(user.resumeId));

        user.resumeId = null;
        await user.save();

        res.redirect('/profile');
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).send('Error deleting resume');
    }
});


// Add this route to handle the edit profile page
router.get('/edit', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.session.user.id });

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        res.render('edit-profile', {
            user,
            title: 'Edit Profile'
        });

    } catch (error) {
        console.error('Edit profile error:', error);
        res.redirect('/profile');
    }
});


router.post('/update', requireAuth, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, gender, currentPassword, newPassword, confirmNewPassword } = req.body;
        const userId = req.session.user.id;

        // Basic profile update
        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { firstName, lastName, email, phone, gender },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).render('edit-profile', {
                user: req.session.user,
                title: 'Edit Profile',
                error: 'User not found'
            });
        }

        // Password change logic
        if (currentPassword || newPassword || confirmNewPassword) {
            // Check all fields are present
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                return res.status(400).render('edit-profile', {
                    user: updatedUser,
                    title: 'Edit Profile',
                    error: 'All password fields are required to change password'
                });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, updatedUser.password);
            if (!isMatch) {
                return res.status(400).render('edit-profile', {
                    user: updatedUser,
                    title: 'Edit Profile',
                    error: 'Current password is incorrect'
                });
            }

            // Check password match
            if (newPassword !== confirmNewPassword) {
                return res.status(400).render('edit-profile', {
                    user: updatedUser,
                    title: 'Edit Profile',
                    error: 'New passwords do not match'
                });
            }

            // Check password strength
            if (newPassword.length < 4) {
                return res.status(400).render('edit-profile', {
                    user: updatedUser,
                    title: 'Edit Profile',
                    error: 'Password must be at least 8 characters long'
                });
            }

            // if (!/[A-Z]/.test(newPassword)) {
            //     return res.status(400).render('edit-profile', {
            //         user: updatedUser,
            //         title: 'Edit Profile',
            //         error: 'Password must contain at least one uppercase letter'
            //     });
            // }

            // if (!/[0-9]/.test(newPassword)) {
            //     return res.status(400).render('edit-profile', {
            //         user: updatedUser,
            //         title: 'Edit Profile',
            //         error: 'Password must contain at least one number'
            //     });
            // }

            // Hash and update password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await User.findOneAndUpdate(
                { userId },
                { password: hashedPassword }
            );
        }

        // Update session
        req.session.user = {
            ...req.session.user,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            gender: updatedUser.gender
        };

        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).render('edit-profile', {
                    user: updatedUser,
                    title: 'Edit Profile',
                    error: 'An error occurred while saving your session'
                });
            }
            // Check if password was changed
            const message = (currentPassword && newPassword && confirmNewPassword)
                ? '?success=Profile+and+password+updated+successfully'
                : '?success=Profile+updated+successfully';

            res.redirect('/profile' + message);
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).render('edit-profile', {
            user: req.session.user,
            title: 'Edit Profile',
            error: 'An unexpected error occurred while updating your profile'
        });
    }
});

module.exports = router;