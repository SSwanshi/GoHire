const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    website: { type: String, required: true },
    location: { type: String, required: true },
    logoId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

CompanySchema.virtual("logoUrl").get(function () {
    if (this.logoId) {
        return `/api/company/logo/${this.logoId}`; 
    }
    return null;
});

module.exports = mongoose.model("Companies", CompanySchema);