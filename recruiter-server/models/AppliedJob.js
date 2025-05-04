const applicantConnection = require('../config/applicantDb');
const mongoose = require('mongoose');

const AppliedJobSchema = new mongoose.Schema({
  userId: String,
  jobId: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  gender: String,
  isSelected: Boolean,
  isRejected: Boolean,
  AppliedAt: Date
}, { timestamps: true });

module.exports = applicantConnection.model('AppliedJob', AppliedJobSchema, 'applied_for_jobs');
