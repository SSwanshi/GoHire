const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  company: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recruiter', recruiterSchema);