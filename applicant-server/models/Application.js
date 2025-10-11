const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }
}, { timestamps: true });

module.exports = mongoose.model("Application", ApplicationSchema);
