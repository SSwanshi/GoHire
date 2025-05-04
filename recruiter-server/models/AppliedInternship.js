const applicantConnection = require('../config/applicantDb');
const mongoose = require('mongoose');

const AppliedInternshipSchema = new mongoose.Schema({
  userId: String,
  internshipId: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  gender: String,
  isSelected: Boolean,
  isRejected: Boolean,
  AppliedAt: Date
}, { timestamps: true });

module.exports = applicantConnection.model('AppliedInternship', AppliedInternshipSchema, 'applied_for_internships');
