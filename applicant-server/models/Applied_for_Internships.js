const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AppliedInternshipSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    internshipId: {
        type: String,
        ref: 'Internship',
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email'] // Simple email validation
    },
    phone: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other'] // Optional: restrict to specific values
    },
    password: {  // NEW: Added password field for authentication
        type: String,
        required: true
    },
    memberSince: {
        type: Date,
        default: Date.now // Changed from String to Date type
    },
    AppliedAt: {
        type: Date,
        default: Date.now // Changed from String to Date type
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'uploads.files'
    },
    isSelected:{
        type: Boolean,
        default: false
    },
    isRejected:{
        type: Boolean,
        default: false
    }
}, { timestamps: true });

AppliedInternshipSchema.index({ userId: 1, internshipId: 1 }, { unique: true });

// Password hashing middleware
module.exports = mongoose.model('Applied_for_Internships', AppliedInternshipSchema);