const mongoose = require("mongoose");

const InternshipSchema = new mongoose.Schema({
    intTitle: { type: String, required: true },
    intDescription: { type: String, required: true },
    intRequirements: { type: String, required: true },
    intStipend: { type: Number, required: true },
    intLocation: { type: String, required: true },
    intDuration: { type: Number, required: true }, 
    intExperience: { type: Number, required: true },
    intPositions: { type: Number, required: true },
    intCompany: { type: mongoose.Schema.Types.ObjectId, ref: "Companies", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Internship", InternshipSchema);
