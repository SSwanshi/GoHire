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

// Add this to your User model
userSchema.statics.findOneOrCreate = async function findOneOrCreate(condition, doc) {
    const result = await this.findOne(condition);
    return result || this.create(doc);
};

module.exports = mongoose.model('User', userSchema);

