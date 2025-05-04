const mongoose = require('mongoose');

const applicantConnection = mongoose.createConnection(process.env.MONGO_URI_APPLICANTS, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = applicantConnection;
