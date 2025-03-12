const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const bodyParser = require("body-parser");
const authRoutes = require('./routes/auth');
const applicantRoutes = require('./routes/applicant');

const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session()); // If using Passport for authentication

// Routes
app.use('/auth', authRoutes);
app.use('/', applicantRoutes);

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Signup Page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Sample user data (in a real app, this would come from a database)
const sampleUser = {
    name: 'Anuj Rathore',
    degree: 'B.Tech/B.E.',
    college: 'Indian Institute of Information Technology (IIIT), Sri City',
    location: 'Chennai',
    phone: '9340041042',
    email: 'anujrathore385@gmail.com',
    gender: 'Male',
    birthdate: '29th August 2006',
    graduationYear: '2027',
    profileCompletion: '74',
    skills: ['HTML', 'CSS', 'Javascript', 'React.js', 'Node.js', 'Express', 'Mern', 'MongoDB', 'Redux', 'C++'],
    languages: [
        { name: 'Hindi', proficiency: 'Can speak, read and write' },
        { name: 'English', proficiency: 'Can speak, read and write' }
    ],
    achievementTime: 'Class XII',
    achievements: 'School topper,Gold medalist,Received scholarship'
};

app.get('/profile', (req, res) => {
    res.render('profile', { user: sampleUser });
});

// API routes for AJAX functionality
app.post('/api/update-profile', (req, res) => {
    // In a real app, you would update the database here
    console.log('Profile update request:', req.body);
    res.json({ success: true, message: 'Profile updated successfully' });
});

app.post('/api/upload-resume', (req, res) => {
    // In a real app, you would handle file upload here
    console.log('Resume upload request received');
    res.json({ success: true, message: 'Resume uploaded successfully' });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
