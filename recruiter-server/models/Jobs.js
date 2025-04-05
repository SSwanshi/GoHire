const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    jobRequirements: { type: String, required: true },
    jobSalary: { type: Number, required: true },
    jobLocation: { type: String, required: true },
    jobType: { type: String, required: true, enum: ["Full-Time", "Part-Time", "Internship"] },
    jobExperience: { type: Number, required: true },
    noofPositions: { type: Number, required: true },
    jobCompany: { type: mongoose.Schema.Types.ObjectId, ref: "Companies", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model("Jobs", JobSchema);
