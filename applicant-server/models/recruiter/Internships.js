const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
    intTitle: String,
    intDescription: String,
    intRequirements: String,
    intStipend: Number,
    intLocation: String,
    intDuration: Number,
    intExperience: Number,
    intPositions: Number,
    intCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    createdBy: mongoose.Schema.Types.ObjectId,
    intExpiry: { 
        type: Date, 
        required: true,
        default: () => new Date(Date.now() + 30*24*60*60*1000) 
    }
}, { timestamps: true });

module.exports = (connection) => {
    return connection.model('Internship', internshipSchema, "internships");
};


