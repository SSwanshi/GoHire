// test-fetch-jobs.js
const mongoose = require('mongoose');


const uri = 'mongodb+srv://gohire:gohire12345678@gohire.kzwudx0.mongodb.net/goHire_recruiters?retryWrites=true&w=majority&appName=GoHire'; // use the recruiter DB URI (not applicant)

const jobSchema = new mongoose.Schema({
  jobTitle: String,
  jobCompany: String,
  jobSalary: Number,
  jobExperience: Number
});

const Job = mongoose.model('Job', jobSchema);

async function testJobs() {
  try {
    const conn = await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const jobs = await Job.find();
    console.log('📄 Jobs fetched:', jobs);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testJobs();
