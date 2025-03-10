const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const companies = [
    {logo: '/uploads/googlelogo.webp',companyName:"Google", website:"https://www.google.co.in",location:"USA"},
    {logo: '/uploads/amazonlogo.png',companyName:"Amazon", website:"https://www.amazon.in",location:"USA"}
];
const jobs = [
    { jobTitle: "Full Stack Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 25, jobLocation: "India", jobType:"Full-Time", jobExperience:2, noofpositions: 10, jobCompany: "Google" },
    { jobTitle: "Full Stack Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 45, jobLocation: "India", jobType:"Full-Time", jobExperience:1, noofpositions: 5, jobCompany: "Amazon" },
    { jobTitle: "Backend Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 35, jobLocation: "India", jobType:"Full-Time", jobExperience:3, noofpositions: 15, jobCompany: "Apple" },
    { jobTitle: "Front-end Developer", jobDescription: "Design a website with good UI/UX", jobRequirements: "Nodejs, Expressjs, MongoDB, React", jobSalary: 50, jobLocation: "India", jobType:"Full-Time", jobExperience:5, noofpositions: 5, jobCompany: "Meta" }
];
const internships = [
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Pune", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Google" },
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Pune", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Amazon" },
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Pune", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Apple" },
    { intTitle: "Front-end Developer", intDescription: "Design a website with good UI", intRequirements: "Nodejs, Expressjs, MongoDB, React", intStipend: 10, intLocation: "Pune", intDuration: 6, intExperience: 1, intPositions: 20, intCompany: "Meta" }
];

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

    res.render('jobs', {jobs, successMessage});
});

module.exports = router; 
module.exports.companies = companies;
module.exports.jobs = jobs;
module.exports.internships = internships;
