const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../shared/middleware/auth');
const {jobs} = require('../../recruiter-server/routes/recruiter');
const {internships} = require('../../recruiter-server/routes/recruiter');
const {companies} = require('../../recruiter-server/routes/recruiter');


// Home
router.get('/', (req, res) => {
  res.render('home');
});

// Job Listings
router.get('/jobs', async (req, res) => {
  res.render('job-list', {jobs: jobs});
});

//Internship List
router.get('/internships', async (req,res)=> {
  res.render('internship-list', {internships: internships});
})


// Company List
router.get('/companies', async (req, res) => {
  // const companies = await Company.find();
  res.render('companylist', {companies: companies});
});

router.get('/contact', async (req,res)=> {
  res.render('contact');
})


// Search Results
router.get('/search', async (req, res) => {
  const query = req.query.q;
  res.render('search-results');
});

module.exports = router;