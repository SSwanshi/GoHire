const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    jobRequirements: { type: String, required: true },
    jobSalary: { type: Number, required: true },
    jobLocation: { type: String, required: true },
    jobType: { type: String, required: true, enum: ["Full-Time", "Part-Time", "Internship"] },
    jobExperience: { type: Number, required: true },
    noofpositions: { type: Number, required: true },
    jobCompany: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Job", JobSchema);
