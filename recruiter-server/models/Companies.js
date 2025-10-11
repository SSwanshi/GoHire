const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    website: { type: String, required: true },
    location: { type: String, required: true },
    logoId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    DateOfESt: {type: String, required: true},
    // 🔒 Added for verification
    verified: { type: Boolean, default: false },
    proofDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }, // stored with GridFS
}, { timestamps: true });

// Virtual URL for logo
CompanySchema.virtual("logoUrl").get(function () {
    if (this.logoId) {
        return `/api/company/logo/${this.logoId}`;
    }
    return null;
});

// Optional virtual for proof document download
CompanySchema.virtual("proofUrl").get(function () {
    if (this.proofDocumentId) {
        return `/api/company/proof/${this.proofDocumentId}`;
    }
    return null;
});

module.exports = mongoose.model("Companies", CompanySchema);
