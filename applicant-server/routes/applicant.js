const express = require('express');
const bodyParser = require("body-parser");
const router = express.Router();
const { ensureAuthenticated } = require('../../shared/middleware/auth');
const { jobs } = require('../../recruiter-server/routes/recruiter');
const { internships } = require('../../recruiter-server/routes/recruiter');
const { companies } = require('../../recruiter-server/routes/recruiter');
const { appUsers } = require('./auth');
const Fuse = require('fuse.js');

router.use(bodyParser.urlencoded({ extended: true }));

// Home
router.get('/', (req, res) => {
  res.render('home', { appUsers });
});

// Job Listings
router.get('/jobs', async (req, res) => {
  res.render('job-list', { jobs: jobs });
});

//Internship List
router.get('/internships', async (req, res) => {
  res.render('internship-list', { internships: internships });
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

module.exports = router;