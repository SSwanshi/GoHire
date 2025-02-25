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
  // const jobs = await Job.find().populate('company');
  res.render('job-list');
});

// Internship Listings
router.get('/internships', async (req, res) => {
  // const internships = await Internship.find().populate('company');
  res.render('internship-list');
});

// Company List
router.get('/companies', async (req, res) => {
  // const companies = await Company.find();
  res.render('companylist');
});

// Search Results
router.get('/search', async (req, res) => {
  const query = req.query.q;
  // const jobs = await Job.find({ $text: { $search: query } }).populate('company');
  // const internships = await Internship.find({ $text: { $search: query } }).populate('company');
  res.render('search-results');
});

module.exports = router;