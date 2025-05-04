// config/applicantDB.js
const mongoose = require("mongoose");

const connectApplicantDB = async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI_APPLICANT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Applicant DB Connected");
    return conn;
  } catch (error) {
    console.error("❌ Applicant DB Connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectApplicantDB;