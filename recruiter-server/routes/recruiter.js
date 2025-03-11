const express = require('express');
const multer = require('multer');
const path = require('path');

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

const users = [
    { firstName: "Sarvjeet", lastName: "Swanshi", email: "sarvjeetswanshi@gmail.com", phone: 8102109959, gender: "male", password: "adminpass",confirmPassword: "adminpaas" },
    { firstName: "Saurav", lastName: "Roy", email: "sauravroy@gmail.com", phone: 9854672132, gender: "male", password: "adminpass",confirmPassword: "adminpaas" }
];

function addCompanyLogosJobs(jobs, companies) {
    return jobs.map(job => {
        const company = companies.find(comp => comp.companyName === job.jobCompany);
        return { ...job, logo: company ? company.logo : null };  //Tip lelo: ...job: This spreads all properties of the job object into the new object.
    });
}

function addCompanyLogosIntern(internships, companies) {
    return internships.map(intern => {
        const company = companies.find(comp => comp.companyName === intern.intCompany);
        return { ...intern, logo: company ? company.logo : null };  //Tip lelo: ...job: This spreads all properties of the job object into the new object.
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
})

module.exports = router; 
module.exports.companies = companies;
module.exports.jobs = jobs;
module.exports.internships = internships;
