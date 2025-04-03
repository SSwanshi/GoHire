const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    website: { type: String, required: true },
    location: { type: String, required: true },
    logoId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" } // Reference to GridFS file
}, { timestamps: true });

// Virtual field to generate GridFS logo URL
CompanySchema.virtual("logoUrl").get(function () {
    if (this.logoId) {
        return `/api/company/logo/${this.logoId}`; // Endpoint to fetch image
    }
    return null;
});

module.exports = mongoose.model("Companies", CompanySchema);