// models/recruiter/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobTitle: String,
    jobDescription: String,
    jobRequirements: String,
    jobSalary: Number,
    jobLocation: String,
    jobType: String,
    jobExperience: Number,
    noofPositions: Number,
    jobCompany: String,
    createdBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

module.exports = (connection) => connection.model('Job', jobSchema);
