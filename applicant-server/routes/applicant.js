const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../shared/middleware/auth');
const Job = require('../../recruiter-server/models/Jobs');
const { internships } = require('../../recruiter-server/routes/recruiter');
const { companies } = require('../../recruiter-server/routes/recruiter');
const { appUsers } = require('./auth');
const Fuse = require('fuse.js');
const connectRecruiterDB = require('../config/recruiterDB');
const createJobModel = require('../models/recruiter/Job');

// router.use(bodyParser.urlencoded({extended:true}));

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
      const Job = createJobModel(recruiterConn);

      const jobs = await Job.find({});
      res.render('job-list', { jobs }); // pass jobs to EJS
  } catch (err) {
      console.error('Error fetching jobs from recruiter DB:', err);
      res.status(500).send('Internal Server Error');
  }
});



//Internship List
router.get('/internships', async (req, res) => {
  res.render('internship-list', { internships: internships , filters: {}, user: req.session.user});
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
  console.log("Received Request Type:", req.method);
    console.log("Received Headers:", req.headers);
    console.log("Received Body:", req.body); 
  const enteredValue = req.body.parsedValue;
  const options1 = {
    keys: ["jobCompany", "jobTitle"],
    threshold: 0.3,
    includeScore: true
  };

const fuse1 = new Fuse(jobs, options1);
function searchJobs(enteredValue) {
  if (!enteredValue) return;
  const results1 = fuse1.search(enteredValue);
  return results1.map(result => result.item);
}
const resultValue1 = searchJobs(enteredValue);

  const options2 = {
    keys: ["intCompany", "intTitle"],
    threshold: 0.3,
    includeScore: true
  };

  const fuse2 = new Fuse(internships, options2);

  function searchIntern(enteredValue) {
    if (!enteredValue) return;
    const results2 = fuse2.search(enteredValue);
    return results2.map(result => result.item);
  }

const resultValue2 = searchIntern(enteredValue);

  res.render('search-results', { enteredValue: enteredValue, sentResult2: resultValue2, sentResult1: resultValue1, user: req.session.user});
});


router.post("/submit-jobs", (req, res) => {
  const { salary, experience } = req.body;
  const selectedFilters = req.body;
  let filteredJobs = jobs;

  if (salary) {
    filteredJobs = filteredJobs.filter((job) => {
      if (salary.includes("less-25") && job.jobSalary < 25) return true;
      if (salary.includes("25-35") && job.jobSalary >= 25 && job.salary <= 35) return true;
      if (salary.includes("35-45") && job.jobSalary >= 35 && job.jobSalary < 45) return true;
      return false;
    });
  }

  if (experience) {
    filteredJobs = filteredJobs.filter((job) => {
      if (experience.includes("fresher") && job.jobExperience === 0) return true;
      if (experience.includes("less-1") && job.jobExperience < 1) return true;
      if (experience.includes("1-3") && job.jobExperience >= 1 && job.jobExperience <= 3) return true;
      if (experience.includes("3-5") && job.jobExperience >= 3 && job.jobExperience <= 5) return true;
      if (experience.includes("5-10") && job.jobExperience >= 5 && job.jobExperience <= 10) return true;
      if (experience.includes("more-10") && job.jobExperience > 10) return true;
      return false;
    });
  }

  res.render("job-list", { jobs: filteredJobs , filters: selectedFilters, user: req.session.user});
});

router.post('/submit-internship', (req, res) => {
  const {duration} = req.body;
  const selectedFilters = req.body;
  let filteredInternships = internships;
  if(duration){
    filteredInternships = filteredInternships.filter((internship) => {
      if(duration.includes('less-1') && internship.intDuration < 1) return true;
      if(duration.includes('1-3') && internship.intDuration >= 1 && internship.intDuration <= 3) return true;
      if(duration.includes('3-6') && internship.intDuration >= 3 && internship.intDuration <= 6) return true;
      if(duration.includes('more-6') && internship.intDuration > 6) return true;
      return false;
    });
  }
  res.render('internship-list', {internships: filteredInternships, filters: selectedFilters, user: req.session.user});
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