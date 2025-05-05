// recruiter-server/routes/applications.js
const express = require('express');
const router = express.Router();
const AppliedJob = require('../models/AppliedJob');
const applicantConnection = require('../config/applicantDb');
const Job = require('../models/Jobs');
const { ObjectId, GridFSBucket } = require('mongodb');
const applicantDb = require('../config/applicantDb');
const PremiumUser = require('../models/PremiumUser');

// View all applicants for a specific job
router.get('/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    console.log('Requested jobId:', jobId);

    const job = await Job.findById(jobId);
    const jobs = await Job.findById(jobId).populate("jobCompany");

    if (!job) {
      return res.status(404).send('Job not found');
    }

    const applicants = await AppliedJob.find({ jobId });

    // Fetch all premium user IDs from applicant DB
    const premiumUsers = await PremiumUser.find({}, 'userId');
    const premiumUserIds = premiumUsers.map(user => user.userId);

    // Sort applicants: premium first, others after
    const premiumApplicants = [];
    const normalApplicants = [];

    applicants.forEach(applicant => {
      if (premiumUserIds.includes(applicant.userId)) {
        premiumApplicants.push(applicant);
      } else {
        normalApplicants.push(applicant);
      }
    });

    const sortedApplicants = [...premiumApplicants, ...normalApplicants];

    res.render('applications', {
      applicants: sortedApplicants,
      jobTitle: job.jobTitle,
      jobCompany: jobs.jobCompany.companyName,
      jobId
    });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).send('Internal Server Error');
  }
});
  
  router.post('/:id/status', async (req, res) => {
    const appId = req.params.id;
    const status = req.body.status;
  
    console.log('Status received:', status); // Log the received status
  
    try {
      let update = {};
  
      if (status === 'accept') {
        update = { isSelected: true, isRejected: false };
      } else if (status === 'reject') {
        update = { isSelected: false, isRejected: true };
      }
  
      console.log('Update to be applied:', update); // Log the update object
  
      const result = await AppliedJob.updateOne(
        { _id: new ObjectId(appId) },
        { $set: update }
      );
  
      if (result.nModified === 0) {
        console.log('No application was updated. This might mean the appId was incorrect.');
      }
  
      res.redirect('back');
    } catch (err) {
      console.error('Error updating application status:', err);
      res.status(500).send('Server error');
    }
  });
  
  

  router.get('/resume/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const db = applicantDb.useDb();
      const usersCollection = db.collection('users');
      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  
      // Step 1: Get resumeId from the user's profile
      const user = await usersCollection.findOne({ userId });
      if (!user || !user.resumeId) {
        return res.status(404).send('Resume not found for user');
      }
  
      // Step 2: Get the resume file
      const files = await db.collection('uploads.files').find({ _id: new ObjectId(user.resumeId) }).toArray();
      if (files.length === 0) {
        return res.status(404).send('Resume file not found');
      }
  
      const file = files[0];
  
      // Step 3: Set headers and stream file
      res.set('Content-Type', file.contentType || 'application/pdf');
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);
  
      bucket.openDownloadStream(new ObjectId(user.resumeId)).pipe(res);
    } catch (error) {
      console.error('Error serving resume:', error);
      res.status(500).send('Error retrieving resume');
    }
  });
  

  module.exports = router;
