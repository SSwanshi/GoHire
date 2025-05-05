// models/Company.js
const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    companyName: String,
    website: String, 
    location: String,
    logoId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verified: { type: Boolean, default: false },
    proofDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }, // stored with GridFS
}, { timestamps: true });

// Virtual field for logo URL
CompanySchema.virtual("logoUrl").get(function () {
    if (this.logoId) {
        return `/api/company/logo/${this.logoId}`;
    }
    return null;
});

CompanySchema.virtual("proofUrl").get(function () {
    if (this.proofDocumentId) {
        return `/api/company/proof/${this.proofDocumentId}`;
    }
    return null;
});

// Make virtuals available when using toObject()/toJSON()
CompanySchema.set("toObject", { virtuals: true });
CompanySchema.set("toJSON", { virtuals: true });

// Export as dynamic model, passing the connection as an argument
module.exports = (connection) => {
    return connection.model("Company", CompanySchema, "companies");
};
