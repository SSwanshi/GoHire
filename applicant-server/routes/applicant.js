const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../shared/middleware/auth');
const Job = require('../../recruiter-server/models/Jobs');
const { internships } = require('../../recruiter-server/routes/recruiter');
const { companies } = require('../../recruiter-server/routes/recruiter');
const { appUsers } = require('./auth');
const Fuse = require('fuse.js');
const connectRecruiterDB = require('../config/recruiterDB');
const { connectDB }= require('../config/db');
const createJobModel = require('../models/recruiter/Job');
const createInternshipModel = require('../models/recruiter/Internships');
const createCompanyModel = require('../models/recruiter/Company');
const { GridFsStorage } = require("multer-gridfs-storage");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const multer = require("multer");
const Internship = require('../../recruiter-server/models/Internship');

// router.use(bodyParser.urlencoded({extended:true}));

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

// Home
router.get('/', (req, res) => {
  res.render('home', { user: req.session.user});
});

// Job Listings
// Example route in applicant.js or similar
router.get('/jobs', async (req, res) => {
  try {
      const recruiterConn = await connectRecruiterDB();
      const JobFindConn = createJobModel(recruiterConn);
      const CompanyModel = createCompanyModel(recruiterConn);

      const JobFind = await JobFindConn.find({}).populate({path: 'jobCompany',
        strictPopulate: false});

        JobFind.forEach(job => {
          console.log("Job Title:", job.jobTitle);
          console.log("Company Name:", job.jobCompany.companyName);
        });

      res.render('job-list', { JobFind, filters: {} }); // pass jobs to EJS
  } catch (err) {
      console.error('Error fetching jobs from recruiter DB:', err);
      res.status(500).send('Internal Server Error');
  }
});


router.get("/logo/:id", async (req, res) => {
  console.log("🔍 Incoming request to /logo/:id");

  try {
      const logoId = req.params.id;
      console.log("🆔 Logo ID from request:", logoId);

      const objectId = new mongoose.Types.ObjectId(logoId);
      console.log("✅ Converted to ObjectId:", objectId);

      const fileExists = await conn.db.collection("uploads.files").findOne({ _id: objectId });

      if (!fileExists) {
          console.log("⚠️ File not found in uploads.files for ID:", objectId);
          return res.status(404).json({ error: "Image not found" });
      }

      console.log("📂 File found. Starting download stream...");
      const downloadStream = bucket.openDownloadStream(objectId);
      res.set("Content-Type", fileExists.contentType || "image/png");
      downloadStream.pipe(res);
      downloadStream.on("end", () => {
          console.log("✅ Image stream ended for:", objectId);
      });
  } catch (error) {
      console.error("❌ Error in /logo/:id route:", error);
      res.status(500).json({ error: "Failed to retrieve image" });
  }
});


//Internship List
router.get('/internships', async (req, res) => {
  try {
    const recruiterConn = await connectRecruiterDB();
    const InternshipFindConn = createInternshipModel(recruiterConn);
    const CompanyModel = createCompanyModel(recruiterConn);

    const InternshipFind = await InternshipFindConn.find({}).populate({path: 'intCompany', strictPopulate: false});

    InternshipFind.forEach(intern => {
      console.log("Internship Title:", intern.intTitle);
      console.log("Company Name:", intern.intCompany.companyName);
    });

    res.render('internship-list', { InternshipFind, filters: {} });
  } catch (err) {
    console.error('Error fetching jobs from recruiter DB:', err);
    res.status(500).send('Internal Server Error');
  }
})

// Company List
router.get('/companies', async (req, res) => {
  // const companies = await Company.find();
  res.render('companylist', { companies: companies ,user: req.session.user});
});

router.get('/contact', async (req, res) => {
  res.render('contact',{user: req.session.user});
})

// Search Results
router.get('/search', async (req, res) => {
  res.render('search-results' , {user: req.session.user});
});

//Premium page
router.get('/competitions', async (req, res) => {
  res.render('competitions' , {user: req.session.user});
});

//Apply_for_Job page
router.get('/applyforJobs', async (req, res) => {
  res.render('Apply_for_Jobs' , {user: req.session.user});
});

//Apply_for_Internship page
router.get('/applyforInternships', async (req, res) => {
  res.render('Apply_for_Internships' , {user: req.session.user});
});

router.get('/Subscription', async (req, res) => {
  res.render('Subscription' , {user: req.session.user});
});

router.post('/search', async (req, res) => {
    console.log("Received Body:", req.body); 
  const enteredValue = req.body.parsedValue;

  const recruiterConn = await connectRecruiterDB();
  const JobFindConn = createJobModel(recruiterConn);
  const InternshipFindConn = createInternshipModel(recruiterConn);
  const CompanyModel = createCompanyModel(recruiterConn);

  const options1 = {
    keys: ["jobCompany.companyName", "jobTitle"],
    threshold: 0.3,
    includeScore: true
  };

  const JobFind = await JobFindConn.find({}).populate({path: 'jobCompany',
    strictPopulate: false});

    JobFind.forEach(job => {
      console.log("Job Title:", job.jobTitle);
      console.log("Company Name:", job.jobCompany.companyName);
    });
  
const fuse1 = new Fuse(JobFind, options1);
function searchJobs(enteredValue) {
  if (!enteredValue) return;
  const results1 = fuse1.search(enteredValue);
  return results1.map(result => result.item);
}
const resultValue1 = searchJobs(enteredValue);

  const options2 = {
    keys: ["intCompany.companyName", "intTitle"],
    threshold: 0.3,
    includeScore: true
  };

  const InternshipFind = await InternshipFindConn.find({}).populate({path: 'intCompany',
    strictPopulate: false});

    InternshipFind.forEach(intern => {
      console.log("Internship Title:", intern.intTitle);
      console.log("Company Name:", intern.intCompany.companyName);
    });
    
  const fuse2 = new Fuse(InternshipFind, options2);

  function searchIntern(enteredValue) {
    if (!enteredValue) return;
    const results2 = fuse2.search(enteredValue);
    return results2.map(result => result.item);
  }

const resultValue2 = searchIntern(enteredValue);
console.log("jobs",resultValue1);

  res.render('search-results', { enteredValue: enteredValue, sentResult2: resultValue2, sentResult1: resultValue1, user: req.session.user});
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
    if(salary4) salaryConditions.push({ jobSalary: { $gte: 30}});

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

    // final query
    const JobFind = await JobFindConn.find(query).populate({path: 'jobCompany',
      strictPopulate: false});
    // Final query
    // const jobs = await Job.find(query).populate('jobCompany');

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
    if(dur1) durConditions.push({intDuration: {$lte: 1}});
    if(dur2) durConditions.push({intDuration: {$gt: 1, $lte: 3}});
    if(dur3) durConditions.push({intDuration: {$gt: 3, $lte: 6}});
    if(dur4) durConditions.push({intDuration: {$gt: 6}});


    if(durConditions.length > 0){
      query.$or = durConditions;
    }

    // final query

    const InternshipFind = await InternshipFindConn.find(query).populate({path: 'intCompany', strictPopulate: false});
    res.render('internship-list', { InternshipFind, filters: req.body });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }

});

router.post('/applyforJobs/:jobTitle', (req, res) => {
  const jobTitle = req.params.jobTitle;

  const selectedJob = jobs.find(job => job.jobTitle === jobTitle);

  if (!selectedJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.render('Apply_for_Jobs', { job: selectedJob, applications });
});

router.post('/ApplyforInternships/:intTitle', (req, res) => {
  const intTitle = req.params.intTitle;

  const selectedInt = internships.find(inte => inte.intTitle === intTitle);

  if (!selectedInt) {
      return res.status(404).json({ error: 'Internship not found' });
  }

  res.render('Apply_for_Internships', { internships: selectedInt, intapplication });
});

module.exports = router;