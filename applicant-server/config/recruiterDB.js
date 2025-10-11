const mongoose = require('mongoose');
require('dotenv').config();

let recruiterConn;

const connectRecruiterDB = async () => {
    if (!recruiterConn) {
        recruiterConn = await mongoose.createConnection(process.env.MONGO_URI_RECRUITERS, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 20000,
        });
        console.log("✅ Connected to recruiter DB from applicants server");
    }
    return recruiterConn;
};

module.exports = connectRecruiterDB;

