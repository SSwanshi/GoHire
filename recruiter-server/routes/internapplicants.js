const express = require('express');
const router = express.Router();
const AppliedInternship = require('../models/AppliedInternship');
const Internship = require('../models/Internship');
const { ObjectId, GridFSBucket } = require('mongodb');
const applicantDb = require('../config/applicantDb');
const PremiumUser = require('../models/PremiumUser');

// View all applicants for a specific internship
router.get('/:internshipId', async (req, res) => {
  try {
    const internshipId = req.params.internshipId;

    // Fetch internship details
    const intern = await Internship.findById(internshipId);
    if (!intern) return res.status(404).send('Internship not found');

    // Fetch all applicants for this internship
    const allApplicants = await AppliedInternship.find({ internshipId });

    // Fetch premium user IDs
    const premiumUsers = await PremiumUser.find({}, 'userId');
    const premiumUserIds = premiumUsers.map(user => user.userId);

    // Sort applicants: premium first
    const premiumApplicants = [];
    const normalApplicants = [];

    allApplicants.forEach(applicant => {
      if (premiumUserIds.includes(applicant.userId)) {
        premiumApplicants.push(applicant);
      } else {
        normalApplicants.push(applicant);
      }
    });

    const sortedApplicants = [...premiumApplicants, ...normalApplicants];

    // Fetch company name using population
    const internsh = await Internship.findById(internshipId).populate("intCompany");

    res.render('intapplication', {
      intapplicants: sortedApplicants,
      intTitle: intern.intTitle,
      intCompany: internsh.intCompany.companyName,
      internshipId
    });
  } catch (err) {
    console.error('Error fetching internship applications:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Update status (accept/reject) of internship application
router.post('/:id/status', async (req, res) => {
  const appId = req.params.id;
  const status = req.body.status;

  try {
    let update = {};

    if (status === 'accept') {
      update = { isSelected: true, isRejected: false };
    } else if (status === 'reject') {
      update = { isSelected: false, isRejected: true };
    }

    // Update the application status based on the selected option
    const result = await AppliedInternship.updateOne(
      { _id: new ObjectId(appId) },
      { $set: update }
    );

    if (result.modifiedCount === 0) {
      console.log('No application was updated. Check the appId.');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if request is AJAX
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: 'Status updated successfully', status: status });
    }

    res.redirect('back');
  } catch (err) {
    console.error('Error updating application status:', err);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.status(500).send('Server error');
  }
});

// Resume viewer route
router.get('/resume/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const db = applicantDb.useDb();
    const usersCollection = db.collection('users');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Fetch user details based on userId
    const user = await usersCollection.findOne({ userId });
    if (!user || !user.resumeId) return res.status(404).send('Resume not found');

    // Find the file in the GridFS bucket
    const file = await db.collection('uploads.files').findOne({ _id: new ObjectId(user.resumeId) });
    if (!file) return res.status(404).send('Resume file not found');

    res.set('Content-Type', file.contentType || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);
    bucket.openDownloadStream(file._id).pipe(res);
  } catch (error) {
    console.error('Error serving resume:', error);
    res.status(500).send('Error retrieving resume');
  }
});

module.exports = router;
