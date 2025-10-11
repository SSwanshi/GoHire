const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    companyName: String,
    website: String, 
    location: String,
    logoId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

CompanySchema.virtual("logoUrl").get(function () {
    if (this.logoId) {
        return `/api/company/logo/${this.logoId}`;
    }
    return null;
});

CompanySchema.set("toObject", { virtuals: true });
CompanySchema.set("toJSON", { virtuals: true });

module.exports = (connection) => {
    return connection.model("Company", CompanySchema, "companies");
};
