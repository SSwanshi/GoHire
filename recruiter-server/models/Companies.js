const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    logoId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }, 
    companyName: { type: String, required: true },
    website: { type: String, required: true },
    location: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Companies", CompanySchema);
