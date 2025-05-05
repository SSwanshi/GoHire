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

const mongoose = require('mongoose');
require('dotenv').config();

const recruiterDB = mongoose.createConnection(process.env.RECRUITER_DB_URI || 'mongodb+srv://gohire:gohire12345678@gohire.kzwudx0.mongodb.net/golfire_recruiters?retryWrites=true&w=majority');

recruiterDB.on('connected', () => {
  console.log('✅ Recruiter DB Connected');
});

recruiterDB.on('error', (err) => {
  console.error('❌ Recruiter DB Connection Error', err);
});

module.exports = recruiterDB;