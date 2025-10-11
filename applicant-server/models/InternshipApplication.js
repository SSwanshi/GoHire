const mongoose = require("mongoose");

const InternshipApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    resume: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("InternshipApplication", InternshipApplicationSchema);
