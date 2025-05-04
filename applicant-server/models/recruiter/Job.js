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
    jobCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    createdBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

module.exports = (connection) => {return connection.models.Job || connection.model('Job', jobSchema)};
