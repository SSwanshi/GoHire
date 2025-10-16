const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../shared/middleware/auth');
const Job = require('../../recruiter-server/models/Jobs');
const { companies } = require('../../recruiter-server/routes/recruiter');
const { appUsers } = require('./auth');
const Fuse = require('fuse.js');
const connectRecruiterDB = require('../config/recruiterDB');
const { connectDB } = require('../config/db');
const createJobModel = require('../models/recruiter/Job');
const createInternshipModel = require('../models/recruiter/Internships');
const createCompanyModel = require('../models/recruiter/Company');
const { GridFsStorage } = require("multer-gridfs-storage");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const multer = require("multer");
const Internship = require('../../recruiter-server/models/Internship');
const axios = require('axios');
const User = require('../models/user');
const Applied_for_Jobs = require('../models/Applied_for_Jobs');
const Applied_for_Internships = require('../models/Applied_for_Internships');

const conn = mongoose.connection;
let bucket;
conn.once("open", () => {
  bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
  console.log("✅ GridFS Bucket Initialized");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const applications = [
  { name: 'Sarvjeet Swanshi', email: 'sarvjeetswanshi@gmail.com', resume: '/resumes/john_doe.pdf' },
  { name: 'Saurav Kumar Roy', email: 'sauravkumar@gmail.com', resume: '/resumes/jane_smith.pdf' }
];

const intapplication = [
  { name: 'Sarvjeet Swanshi', email: 'sarvjeetswanshi@gmail.com', resume: '/resumes/john_doe.pdf' },
  { name: 'Saurav Kumar Roy', email: 'sauravkumar@gmail.com', resume: '/resumes/jane_smith.pdf' }
];

router.get('/', (req, res) => {
  res.render('home', { user: req.session.user });
});
router.get('/jobs', async (req, res) => {
  try {
    const recruiterConn = await connectRecruiterDB();
    const JobFindConn = createJobModel(recruiterConn);
    const CompanyModel = createCompanyModel(recruiterConn);

    const JobFind = await JobFindConn.find({}).populate({
      path: 'jobCompany',
      strictPopulate: false
    });

    res.render('job-list', { JobFind, filters: {} });
  } catch (err) {
    console.error('Error fetching jobs from recruiter DB:', err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/logo/:logoId', async (req, res) => {
  try {
    const logoId = req.params.logoId;

    // Fetch the logo from recruiter server
    const response = await axios({
      method: 'get',
      url: `http://localhost:5000/recruiter/logo/${logoId}`,
      responseType: 'stream'
    });

    // Set the same content type
    res.setHeader('Content-Type', response.headers['content-type']);

    // Pipe the data (image) to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('Error proxying logo:', error.message);
    res.status(500).json({ error: 'Failed to fetch logo' });
  }
});

router.get('/internships', async (req, res) => {
  try {
    const recruiterConn = await connectRecruiterDB();
    const InternshipFindConn = createInternshipModel(recruiterConn);
    const CompanyModel = createCompanyModel(recruiterConn);

    const InternshipFind = await InternshipFindConn.find({}).populate({ path: 'intCompany', strictPopulate: false });


    res.render('internship-list', { InternshipFind, filters: {} });
  } catch (err) {
    console.error('Error fetching jobs from recruiter DB:', err);
    res.status(500).send('Internal Server Error');
  }
})

// Company List
router.get('/companies', async (req, res) => {
  // const companies = await Company.find();
  res.render('companylist', { companies: companies, user: req.session.user });
});

router.get('/contact', async (req, res) => {
  res.sendFile(require('path').join(__dirname, '../views/contact.html'));
})

router.get('/search', async (req, res) => {
  res.render('search-results', { user: req.session.user });
});
router.get('/competitions', async (req, res) => {
  res.sendFile(require('path').join(__dirname, '../views/competitions.html'));
});

router.get('/applyforJobs', async (req, res) => {
  res.render('Apply_for_Jobs', { user: req.session.user });
});

router.get('/AppliedforJobs', async (req, res) => {
  res.render('Applied_for_Jobs', { user: req.session.user });
});

router.get('/AppliedforInternships', async (req, res) => {
  res.render('Applied_for_Internships', { user: req.session.user });
});

router.get('/applyforInternships', async (req, res) => {
  res.render('Apply_for_Internships', { user: req.session.user });
});

router.get('/Subscription', async (req, res) => {
  res.render('Subscription', { user: req.session.user });
});

router.post('/search', async (req, res) => {
  console.log("Received Body:", req.body);
  const enteredValue = req.body.parsedValue;

  const recruiterConn = await connectRecruiterDB();
  const JobFindConn = createJobModel(recruiterConn);
  const InternshipFindConn = createInternshipModel(recruiterConn);
  const CompanyModel = createCompanyModel(recruiterConn);

  const JobFind = await JobFindConn.find({}).populate({
    path: 'jobCompany',
    strictPopulate: false
  });

  JobFind.forEach(job => {
    console.log("Job Title:", job.jobTitle);
    console.log("Company Name:", job.jobCompany ? job.jobCompany.companyName : 'Company Not Available');
  });

  const options1 = {
    keys: [
      {
        name: "companyName",
        getFn: (obj) => obj.jobCompany ? obj.jobCompany.companyName : ""
      },
      "jobTitle"
    ],
    threshold: 0.3,
    includeScore: true
  };

  const fuse1 = new Fuse(JobFind, options1);
  function searchJobs(enteredValue) {
    if (!enteredValue) return;
    const results1 = fuse1.search(enteredValue);
    return results1.map(result => result.item);
  }
  const resultValue1 = searchJobs(enteredValue);

  const InternshipFind = await InternshipFindConn.find({}).populate({
    path: 'intCompany',
    strictPopulate: false
  });

  InternshipFind.forEach(intern => {
    console.log("Internship Title:", intern.intTitle);
    console.log("Company Name:", intern.intCompany ? intern.intCompany.companyName : 'Company Not Available');
  });

  const options2 = {
    keys: [
      {
        name: "companyName",
        getFn: (obj) => obj.intCompany ? obj.intCompany.companyName : ""
      },
      "intTitle"
    ],
    threshold: 0.3,
    includeScore: true
  };

  const fuse2 = new Fuse(InternshipFind, options2);

  function searchIntern(enteredValue) {
    if (!enteredValue) return;
    const results2 = fuse2.search(enteredValue);
    return results2.map(result => result.item);
  }

  const resultValue2 = searchIntern(enteredValue);
  console.log("jobs", resultValue1);

  res.render('search-results', { enteredValue: enteredValue, sentResult2: resultValue2, sentResult1: resultValue1, user: req.session.user });
});

router.post('/submit-jobs', async (req, res) => {
  try {
    const {
      salary1,
      salary2,
      salary3,
      salary4,
      exp1,
      exp2,
      exp3,
      exp4,
      exp5,
      exp6,
    } = req.body;
    const recruiterConn = await connectRecruiterDB();
    const JobFindConn = createJobModel(recruiterConn)
    const CompanyModel = createCompanyModel(recruiterConn);

    // Construct query object
    const query = {};

    // Salary Range Filters
    let salaryConditions = [];
    if (salary1) salaryConditions.push({ jobSalary: { $lt: 10 } });
    if (salary2) salaryConditions.push({ jobSalary: { $gte: 10, $lte: 20 } });
    if (salary3) salaryConditions.push({ jobSalary: { $gte: 20, $lte: 30 } });
    if (salary4) salaryConditions.push({ jobSalary: { $gte: 30 } });

    // // Custom salary
    // if (salary4 && req.body.customMin && req.body.customMax) {
    //   const min = parseInt(req.body.customMin.replace(/[^0-9]/g, ""));
    //   const max = parseInt(req.body.customMax.replace(/[^0-9]/g, ""));
    //   if (!isNaN(min) && !isNaN(max)) {
    //     salaryConditions.push({ jobSalary: { $gte: min, $lte: max } });
    //   }
    // }

    if (salaryConditions.length > 0) {
      query.$or = salaryConditions;
    }

    // Experience Filter
    let expConditions = [];
    if (exp1) expConditions.push({ jobExperience: 0 });
    if (exp2) expConditions.push({ jobExperience: { $lt: 1 } });
    if (exp3) expConditions.push({ jobExperience: { $gte: 1, $lte: 3 } });
    if (exp4) expConditions.push({ jobExperience: { $gte: 3, $lte: 5 } });
    if (exp5) expConditions.push({ jobExperience: { $gte: 5, $lte: 10 } });
    if (exp6) expConditions.push({ jobExperience: { $gt: 10 } });

    if (expConditions.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({ $or: expConditions });
    }
    const JobFind = await JobFindConn.find(query).populate({
      path: 'jobCompany',
      strictPopulate: false
    });

    res.render('job-list', { JobFind, filters: req.body }); // or send JSON: res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post('/submit-internship', async (req, res) => {
  try {
    const {
      dur1,
      dur2,
      dur3,
      dur4,
    } = req.body;

    const recruiterConn = await connectRecruiterDB();
    const InternshipFindConn = createInternshipModel(recruiterConn);
    const CompanyModel = createCompanyModel(recruiterConn);

    const query = {};

    // duration filter
    let durConditions = [];
    if (dur1) durConditions.push({ intDuration: { $lte: 1 } });
    if (dur2) durConditions.push({ intDuration: { $gt: 1, $lte: 3 } });
    if (dur3) durConditions.push({ intDuration: { $gt: 3, $lte: 6 } });
    if (dur4) durConditions.push({ intDuration: { $gt: 6 } });


    if (durConditions.length > 0) {
      query.$or = durConditions;
    }

    // final query

    const InternshipFind = await InternshipFindConn.find(query).populate({ path: 'intCompany', strictPopulate: false });
    res.render('internship-list', { InternshipFind, filters: req.body });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }

});

router.post('/applyforJobs/:jobID', async (req, res) => {
  const jobId = req.params.jobID;
  const userId = req.session.user?.id;  // If you're using Passport.js or some other session-based auth

  const recruiterConn = await connectRecruiterDB();
  const JobFindConn = createJobModel(recruiterConn);
  const CompanyModel = createCompanyModel(recruiterConn);

  const JobFind = await JobFindConn.findById(jobId).populate({
    path: 'jobCompany',
    strictPopulate: false
  });
  console.log(JobFind);

  if (!JobFind) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const alreadyApplied = await Applied_for_Jobs.findOne({ userId, jobId });
  if (alreadyApplied) {
    return res.render('Applied_for_Jobs', { job: JobFind, applications, user: req.session.user });
  }
  else {
    return res.render('Apply_for_Jobs', { job: JobFind, applications, user: req.session.user });
  }
});

router.post('/appliedforJobs/:jobID', async (req, res) => {
  try {
    // Get user data from session (assuming user is authenticated and data is in req.user)
    const userId = req.session.user?.id;  // If you're using Passport.js or some other session-based auth
    const jobId = req.params.jobID; // Get job ID from the route parameter

    // Fetch the job from the database (Optional, you can check if the job exists)
    const recruiterConn = await connectRecruiterDB();
    const JobModel = createJobModel(recruiterConn);
    const JobFindConn = createJobModel(recruiterConn);
    const JobFind = await JobFindConn.findById(jobId).populate({
      path: 'jobCompany',
      strictPopulate: false
    });
    const job = await JobModel.findById(jobId);
    if (!job) return res.status(404).send("Job not found");

    if (!userId) {
      return res.render('Apply_for_Jobs', {
        job: JobFind,
        applications,
        user: req.session.user,
        error: 'Please login to apply for this job.'
      });
    }

    // Fetch the user from the database using the userId (this is optional if you have user data in the session)
    const user = await User.findOne({ userId });
    const userResume = user.resumeId;
    if (!userResume) {
      return res.render('Apply_for_Jobs', {
        job: JobFind,
        applications,
        user: req.session.user,
        error: 'Please upload Resume to apply for this job.'
      });
    }
    if (!user) return res.status(404).send("User not found");

    // Check if the user has already applied for the job
    const alreadyApplied = await Applied_for_Jobs.findOne({ userId, jobId });
    console.log(alreadyApplied);
    if (alreadyApplied) {
      return res.status(400).send("You have already applied for this job.");
    }

    // Create a new application based on the user data
    const application = new Applied_for_Jobs({
      userId,  // Automatically comes from session
      jobId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      password: user.password,
      resumeId: user.resumeId,  // Assuming the user has a resume stored
      memberSince: user.memberSince,
      // AppliedAt will automatically be set to current date and time
    });

    // Save the application to the database
    await application.save();

    // Send a success message or redirect the user to another page
    res.render('Applied_for_Jobs', { job: JobFind, applications, user: req.session.user });  // Redirect to the applications list or a confirmation page
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post('/ApplyforInternships/:intID', async (req, res) => {
  const internshipId = req.params.intID;
  const userId = req.session.user?.id;

  const recruiterConn = await connectRecruiterDB();
  const InternshipFindConn = createInternshipModel(recruiterConn);
  const CompanyModel = createCompanyModel(recruiterConn);

  const InternshipFind = await InternshipFindConn.findById(internshipId).populate({
    path: 'intCompany',
    strictPopulate: false
  });

  if (!InternshipFind) {
    return res.status(404).json({ error: 'Internship not found' });
  }

  const alreadyApplied = await Applied_for_Internships.findOne({ userId, internshipId });
  if (alreadyApplied) {
    return res.render('Applied_for_Internships', { internship: InternshipFind, applications, user: req.session.user });
  }
  else {
    return res.render('Apply_for_Internships', { internship: InternshipFind, applications, user: req.session.user });
  }
});

router.post('/appliedforInternships/:internshipID', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const internshipId = req.params.internshipID;
    console.log("internshipId =", internshipId);

    const recruiterConn = await connectRecruiterDB();
    const InternshipModel = createInternshipModel(recruiterConn);

    const InternshipFind = await InternshipModel.findById(internshipId).populate({
      path: 'internshipCompany',
      strictPopulate: false
    });

    if (!InternshipFind) {
      return res.status(404).send("Internship not found");
    }

    if (!userId) {
      return res.render('Apply_for_Internships', {
        internship: InternshipFind,
        applications,
        user: req.session.user,
        error: 'Please login to apply for this internship.'
      });
    }

    const user = await User.findOne({ userId });
    const userResume = user.resumeId;
    if (!userResume) {
      return res.render('Apply_for_Internships', {
        internship: InternshipFind,
        applications,
        user: req.session.user,
        error: 'Please login to apply for this internship.'
      });
    }
    if (!user) return res.status(404).send("User not found");

    const alreadyApplied = await Applied_for_Internships.findOne({ userId, internshipId });
    if (alreadyApplied) {
      return res.status(400).send("You have already applied for this internship.");
    }

    const application = new Applied_for_Internships({
      userId,
      internshipId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      password: user.password,
      resumeId: user.resumeId,
      memberSince: user.memberSince,
    });

    await application.save();

    res.render('Applied_for_Internships', {
      internship: InternshipFind,
      applications,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


module.exports = router;