const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AppliedJobSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    jobId: {
        type: String,
        ref: 'Job',
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
    AppliedAt: {
        type: Date,
        default: Date.now
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

AppliedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Applied_for_Jobs', AppliedJobSchema);