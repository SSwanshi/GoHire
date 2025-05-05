// // config/recruiterDB.js
// const mongoose = require('mongoose');
// require('dotenv').config();

// let recruiterConn;

// const connectRecruiterDB = async () => {
//     if (!recruiterConn) {
//         recruiterConn = await mongoose.createConnection(process.env.MONGO_URI_RECRUITERS, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             serverSelectionTimeoutMS: 20000,
//         });
//         console.log("✅ Connected to recruiter DB from applicants server");
//     }
//     return recruiterConn;
// };

// module.exports = connectRecruiterDB;

// config/recruiterDB.js
const mongoose = require('mongoose');
const recruiterSchema = require('../models/Recruiter');
require('dotenv').config();

let recruiterConn;

const connectRecruiterDB = async () => {
    if (!recruiterConn) {
        recruiterConn = await mongoose.createConnection(process.env.MONGO_URI_RECRUITERS, {
            serverSelectionTimeoutMS: 20000
        });

        // Register the model once the connection is established
        if (!recruiterConn.models.Recruiter) {
            recruiterConn.model('RecruiterUser', recruiterSchema);
          }

        console.log("✅ Recruiter DB Connected");
    }
    return recruiterConn;
};

module.exports = connectRecruiterDB;
