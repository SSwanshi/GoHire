const express = require('express');
const path = require('path');
const Job = require('../recruiter-server/models/Jobs');
const Internship = require('../recruiter-server/models/Internship');
const { companies } = require('../recruiter-server/routes/recruiter');
const { applications } = require('../recruiter-server/routes/recruiter');
const { users } = require('../recruiter-server/routes/auth');
const connectDB = require("./config/db");
const createJobModel = require('../applicant-server/models/recruiter/Job');
const createCompanyModel = require('../applicant-server/models/recruiter/Job');



require("dotenv").config();
const app = express();
const PORT = 9000;
const session = require('express-session');

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const validUsers = [
    { email: 'sarvjeet.s23@iiits.in', password: '1234', isPremium: true },
    { email: 'sauravkumar.r23@iiits.in', password: '1234', isPremium: false },
    { email: 'kartik.r23@iiits.in', password: '1234', isPremium: true },
    { email: 'anuj.r23@iiits.in', password: '1234', isPremium: true },
    { email: 'likhita.b23@iiits.in', password: '1234', isPremium: true }
];

app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = validUsers.find(user => user.email === email);

    if (user) {
        if (user.password === password) {
            req.session.user = user;
            return res.redirect('/home');
        } else {
            return res.send('Incorrect password');
        }
    } else {
        return res.send('Incorrect email');
    }
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/applicantlist', (req, res) => {
    res.render('applicantlist', {applications: applications});
});

app.get('/companylist', (req, res) => {
    res.render('companylist', { companies: companies });
});

app.get('/internshiplist', (req, res) => {
    res.render('internshiplist', { companies: companies, internships: internships });
});

app.get('/joblist', async (req, res) => {
    try {
      const recruiterConn = await connectDB();
      const JobModel = createJobModel(recruiterConn);
      const CompanyModel = createCompanyModel(recruiterConn);
  
      // Get all companies
      const companies = await CompanyModel.find({}).lean();
  
      // Get all jobs and populate the company reference
      const jobs = await JobModel.find({})
        .populate({ path: 'jobCompany', strictPopulate: false })
        .lean();
  
      // Group jobs under their respective companies
      const companyMap = {};
  
      // Initialize company map
      companies.forEach(company => {
        company.jobs = [];
        companyMap[company._id.toString()] = company;
      });
  
      // Distribute jobs into the matching company
      jobs.forEach(job => {
        const companyId = job.jobCompany?._id?.toString();
        if (companyId && companyMap[companyId]) {
          companyMap[companyId].jobs.push(job);
        }
      });
      
      console.log(JSON.stringify(companies, null, 2));

      // Send structured companies (with jobs attached) to EJS
      res.render('joblist', {
        companies: Object.values(companyMap),
        filters: {}
      });
  
    } catch (err) {
      console.error('Error fetching jobs from recruiter DB:', err);
      res.status(500).send('Internal Server Error');
    }
});
  

const isPremiumUser = (req, res, next) => {
    
        next(); 
    
};

app.get('/premiumuser', isPremiumUser, (req, res) => {

    const premiumUsers = validUsers
        .filter(user => user.isPremium) 
        .sort((a, b) => a.email.localeCompare(b.email)); 
   
    res.render('premiumuser', { user: req.session.user, premiumUsers: premiumUsers });
});

app.get('/recruiterlist', (req, res) => {
    res.render('recruiterlist', {users: users});
});

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});