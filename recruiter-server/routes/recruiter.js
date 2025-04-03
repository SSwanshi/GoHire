const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Company = require('../models/Companies');
const Job = require('../models/Jobs');
const Internship = require('../models/Internship');
const { Application, InternshipApplication } = require('../../applicant-server/models/Application');

const router = express.Router();

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

router.post('/add-company', upload.single('logo'), async (req, res) => {
    try {
        const { companyName, description, website, location } = req.body;
        if (!companyName || !description || !website || !location || !req.file) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const newCompany = new Company({
            companyName,
            description,
            website,
            location,
            logo: req.file.buffer 
        });
        await newCompany.save();
        
        res.redirect('/recruiter/companies');
    } catch (error) {
        res.status(500).json({ error: 'Failed to add company' });
    }
});

// Get all companies
router.get('/companies', async (req, res) => {
    try {
        const companies = await Company.find();
        res.render('companies', { companies });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Add a job
router.post('/add-job', async (req, res) => {
    try {
        const { jobTitle, jobDescription, jobRequirements, jobSalary, jobLocation, jobType, jobExperience, noofpositions, jobCompany } = req.body;
        if (!jobTitle || !jobDescription || !jobRequirements || !jobSalary || !jobLocation || !jobType || !jobExperience || !noofpositions || !jobCompany) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newJob = new Job({
            jobTitle,
            jobDescription,
            jobRequirements,
            jobSalary,
            jobLocation,
            jobType,
            jobExperience,
            noofpositions,
            jobCompany
        });
        await newJob.save();
        res.redirect('/recruiter/jobs');
    } catch (error) {
        res.status(500).json({ error: 'Failed to add job' });
    }
});

// Get all jobs
router.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find();
        res.render('jobs', { jobs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Add an internship
router.post('/add-internship', async (req, res) => {
    try {
        const { intTitle, intDescription, intRequirements, intStipend, intLocation, intDuration, intExperience, intPositions, intCompany } = req.body;
        if (!intTitle || !intDescription || !intRequirements || !intStipend || !intLocation || !intDuration || !intExperience || !intPositions || !intCompany) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const newInternship = new Internship({
            intTitle,
            intDescription,
            intRequirements,
            intStipend,
            intLocation,
            intDuration,
            intExperience,
            intPositions,
            intCompany
        });
        await newInternship.save();
        res.redirect('/recruiter/internships');
    } catch (error) {
        res.status(500).json({ error: 'Failed to add internship' });
    }
});

// Get all internships
router.get('/internships', async (req, res) => {
    try {
        const internships = await Internship.find();
        res.render('internships', { internships });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch internships' });
    }
});

// Delete a company
router.post('/delete-company/:companyId', async (req, res) => {
    try {
        await Company.findByIdAndDelete(req.params.companyId);
        res.redirect('/recruiter/companies');
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

// Delete a job
router.post('/delete-job/:jobId', async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.jobId);
        res.redirect('/recruiter/jobs');
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// Delete an internship
router.post('/delete-intern/:intId', async (req, res) => {
    try {
        await Internship.findByIdAndDelete(req.params.intId);
        res.redirect('/recruiter/internships');
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete internship' });
    }
});

// Get job applicants
router.post('/applicant-job/:jobId', async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        const applications = await Application.find({ jobTitle: job.jobTitle });
        res.render('applications', { job, applications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Get internship applicants
router.post('/applicant-intern/:intId', async (req, res) => {
    try {
        const intern = await Internship.findById(req.params.intId);
        const intapplications = await InternshipApplication.find({ intTitle: intern.intTitle });
        res.render('intapplication', { intern, intapplications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch internship applications' });
    }
});

module.exports = router;
