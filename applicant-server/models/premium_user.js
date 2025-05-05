const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PremiumUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        default: () => Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) // Random string
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
        unique: true,
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
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'uploads.files'
    }
}, { timestamps: true });

// Password hashing middleware
module.exports = mongoose.model('Premium_User', PremiumUserSchema);