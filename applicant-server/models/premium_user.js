const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PremiumUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        default: () => Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
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
        match: [/.+\@.+\..+/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },
    password: {
        type: String,
        required: true
    },
    memberSince: {
        type: Date,
        default: Date.now
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'uploads.files'
    }
}, { timestamps: true });

module.exports = mongoose.model('Premium_User', PremiumUserSchema);