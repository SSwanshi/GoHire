const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../shared/middleware/auth');
const { jobs } = require('../../recruiter-server/routes/recruiter');
const { internships } = require('../../recruiter-server/routes/recruiter');
const { companies } = require('../../recruiter-server/routes/recruiter');
const { appUsers } = require('./auth');
const Fuse = require('fuse.js');


// router.use(bodyParser.urlencoded({extended:true}));

// Home
router.get('/', (req, res) => {
  res.render('home', { appUsers });
});

// Job Listings
router.get('/jobs', async (req, res) => {
  res.render('job-list', { jobs: jobs , filters: {} });
});

//Internship List
router.get('/internships', async (req, res) => {
  res.render('internship-list', { internships: internships , filters: {}});
})

// Company List
router.get('/companies', async (req, res) => {
  // const companies = await Company.find();
  res.render('companylist', { companies: companies });
});

router.get('/contact', async (req, res) => {
  res.render('contact');
})

// Search Results
router.get('/search', async (req, res) => {
  res.render('search-results');
});

//Premium page
router.get('/competitions', async (req, res) => {
  res.render('competitions');
});

//Apply_for_Job page
router.get('/applyforJobs', async (req, res) => {
  res.render('Apply_for_Jobs');
});

//Apply_for_Internship page
router.get('/applyforInternships', async (req, res) => {
  res.render('Apply_for_Internships');
});

router.get('/Subscription', async (req, res) => {
  res.render('Subscription');
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

  res.render('search-results', { enteredValue: enteredValue, sentResult2: resultValue2, sentResult1: resultValue1 });
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

  res.render("job-list", { jobs: filteredJobs , filters: selectedFilters});
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
  res.render('internship-list', {internships: filteredInternships, filters: selectedFilters});
})

module.exports = router;