const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
        required: true,
        select: false // Won't be returned in queries unless explicitly asked for
    },
    memberSince: {
        type: Date,
        default: Date.now // Changed from String to Date type
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'uploads.files'
    }
});

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = function (candidatePassword) {
    if (!candidatePassword || !this.password) {
        return false;
    }
    return candidatePassword === this.password;
};

// Keep your existing static method
userSchema.statics.findOneOrCreate = async function findOneOrCreate(condition, doc) {
    const result = await this.findOne(condition);
    return result || this.create(doc);
};

module.exports = mongoose.model('User', userSchema);

