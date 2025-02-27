const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../shared/middleware/auth');
const User = require('../models/user');
const Job = require('../models/job');
const Internship = require('../models/internship');

// Home
router.get('/', (req, res) => {
  res.render('home');
});

// Job Listings
router.get('/jobs', async (req, res) => {
  res.render('job-list');
});

//Internship List
router.get('/internships', async (req,res)=> {
  res.render('internship-list');
})


// Company List
router.get('/companies', async (req, res) => {
  // const companies = await Company.find();
  res.render('companylist');
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