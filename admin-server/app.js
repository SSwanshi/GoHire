const express = require('express');
const path = require('path');
const { jobs } = require('../recruiter-server/routes/recruiter');
const { internships } = require('../recruiter-server/routes/recruiter');
const { companies } = require('../recruiter-server/routes/recruiter');
const { applications } = require('../recruiter-server/routes/recruiter');
const { users } = require('../recruiter-server/routes/auth');

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

app.get('/joblist', (req, res) => {
    res.render('joblist', { companies: companies, jobs: jobs });
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});