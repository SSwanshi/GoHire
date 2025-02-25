const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const applicantRoutes = require('./routes/applicant');
const { ensureAuthenticated } = require('../shared/middleware/auth');

const app = express();

// Database Connection
// mongoose.connect(, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB Connected'))
//   .catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');



app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', applicantRoutes);

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Applicant Server running on http://localhost:${PORT}`));

