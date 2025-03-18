const express = require('express');
const multer = require('multer');
const path = require('path');
const { Application, InternshipApplication } = require('../database'); 

const router = express.Router();

const companies = [
    {logo: '/uploads/googlelogo.webp',companyName:"Google", website:"https://www.google.co.in",location:"USA"},
    {logo: '/uploads/amazonlogo.png',companyName:"Amazon", website:"https://www.amazon.in",location:"USA"},
];
const jobs = [
    { jobTitle: "Full Stack Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 25, jobLocation: "India", jobType:"Full-Time", jobExperience:2, noofpositions: 10, jobCompany: "Google" },
    { jobTitle: "Full Stack Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 45, jobLocation: "India", jobType:"Full-Time", jobExperience:1, noofpositions: 5, jobCompany: "Amazon" },
    { jobTitle: "Backend Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 35, jobLocation: "India", jobType:"Full-Time", jobExperience:3, noofpositions: 15, jobCompany: "Google" },
    { jobTitle: "Front-end Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 50, jobLocation: "India", jobType:"Full-Time", jobExperience:5, noofpositions: 5, jobCompany: "Amazon" }
];
const internships = [
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Pune", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Google" },
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Delhi", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Amazon" },
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Mumbai", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Google" },
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Kolkata", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Amazon" }
];

function addCompanyLogosJobs(jobs, companies) {
    return jobs.map(job => {
        const company = companies.find(comp => comp.companyName === job.jobCompany);
        return { ...job, logo: company ? company.logo : null };  
    });
}

function addCompanyLogosIntern(internships, companies) {
    return internships.map(intern => {
        const company = companies.find(comp => comp.companyName === intern.intCompany);
        return { ...intern, logo: company ? company.logo : null };  
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});
 
const upload = multer({ storage: storage });

router.post('/add-company', upload.single('logo'), (req, res) => {
    const { companyName, description, website, location } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!companyName || !description || !website || !location || !logo) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const newCompany = { companyName, description, website, location, logo };
    companies.push(newCompany);

    req.session.successMessage = 'Company added successfully';

    res.redirect('/recruiter/companies');
});

router.get('/companies', (req, res) => {
    const successMessage = req.session.successMessage;
    req.session.successMessage = null; 

    res.render('companies', { companies, successMessage });
});

router.post('/add-job', (req,res)=>{
    const { jobTitle, jobDescription, jobRequirements, jobSalary, jobLocation, jobType, jobExperience, noofpositions, jobCompany } = req.body;

    if(!jobTitle || !jobDescription || !jobRequirements || !jobSalary || !jobLocation || !jobType || !jobExperience || !noofpositions || !jobCompany){
        return res.status(400).json({error: 'All fields are required'});
    }

    const newJob = {jobTitle, jobDescription, jobRequirements, jobSalary, jobLocation, jobType, jobExperience, noofpositions, jobCompany };
    jobs.push(newJob);

    req.session.successMessage = 'Job added successfully';
    res.redirect('/recruiter/jobs');
});

router.get('/jobs', (req,res) =>{
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;

    const updatedJobs = addCompanyLogosJobs(jobs, companies);
    res.render('jobs', { jobs: updatedJobs, successMessage, companies });
});

router.post('/add-internship', (req,res) => {
    const { intTitle, intDescription, intRequirements, intStipend, intLocation, intDuration, intExperience, intPositions, intCompany } = req.body;

    if(!intTitle || !intDescription|| !intRequirements || !intStipend || !intLocation || !intDuration || !intExperience || !intPositions || !intCompany){
        return res.status(400).json({ error: 'All fields are required' });
    }

    const newInternship = { intTitle, intDescription, intRequirements, intStipend, intLocation, intDuration, intExperience, intPositions, intCompany };
    internships.push(newInternship);

    req.session.successMessage = 'Internship added successfully';
    res.redirect('/recruiter/internships');

});

router.get('/internships', (req,res) => {
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;

    const updatedIntern = addCompanyLogosIntern(internships, companies);
    res.render('internships', {internships:updatedIntern , successMessage, companies});
});

router.post('/delete-company/:companyName', (req, res) => {
    const companyName = req.params.companyName;

    const companyIndex = companies.findIndex(comp => comp.companyName === companyName);

    if (companyIndex === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }

    companies.splice(companyIndex, 1);

    req.session.successMessage = 'Company deleted successfully';
    res.redirect('/recruiter/companies');
});

router.post('/delete-job/:jobTitle', (req, res) => {
    const jobTitle = req.params.jobTitle;

    const jobIndex = jobs.findIndex(jo => jo.jobTitle === jobTitle);

    if (jobIndex === -1) {
        return res.status(404).json({ error: 'Job not found' });
    }

    jobs.splice(jobIndex, 1);

    req.session.successMessage = 'Job deleted successfully';
    res.redirect('/recruiter/jobs');
});

router.post('/delete-intern/:intTitle', (req, res) => {
    const intTitle = req.params.intTitle;

    const intIndex = internships.findIndex(inte => inte.intTitle === intTitle);

    if (intIndex === -1) {
        return res.status(404).json({ error: 'Internship not found' });
    }

    internships.splice(intIndex, 1);

    req.session.successMessage = 'Internship deleted successfully';
    res.redirect('/recruiter/internships');
});

router.post('/applicant-job/:jobTitle', async (req, res) => {
    const jobTitle = req.params.jobTitle;

    const selectedJob = jobs.find(job => job.jobTitle === jobTitle);

    if (!selectedJob) {
        return res.status(404).json({ error: 'Job not found' });
    }

    try {
        const applications = await Application.findAll({ where: { jobTitle } });
        res.render('applications', { job: selectedJob, applications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

router.post('/applicant-intern/:intTitle', async (req, res) => {
    const intTitle = req.params.intTitle;

    const selectedInt = internships.find(inte => inte.intTitle === intTitle);

    if (!selectedInt) {
        return res.status(404).json({ error: 'Internship not found' });
    }

    try {
        const intapplications = await InternshipApplication.findAll({ where: { intTitle } });
        res.render('intapplication', { intern: selectedInt, intapplications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch internship applications' });
    }
});

module.exports = router; 
module.exports.companies = companies;
module.exports.jobs = jobs;
module.exports.internships = internships;