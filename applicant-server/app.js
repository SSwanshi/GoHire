const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const path = require('path');
const applicantRoutes = require('./routes/applicant');
const { ensureAuthenticated } = require('../shared/middleware/auth');

const app = express();

app.set('view engine', 'ejs');

// Middleware
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
// Routes
app.use('/', applicantRoutes);

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Applicant Server running on http://localhost:${PORT}`));

