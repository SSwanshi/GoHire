const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    gender: String,
    memberSince: String,
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' } // Reference to GridFS file
});

module.exports = mongoose.model('User', userSchema);

