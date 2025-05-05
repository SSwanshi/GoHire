// recruiter-server/models/PremiumUser.js
const mongoose = require('mongoose');
const applicantConnection = require('../config/applicantDb');

const premiumUserSchema = new mongoose.Schema({
  userId: String
}, { collection: 'premium_users' });

module.exports = applicantConnection.model('PremiumUser', premiumUserSchema);
