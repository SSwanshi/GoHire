const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const applicantRoutes = require('./routes/applicant');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', applicantRoutes);

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Applicant Server running on http://localhost:${PORT}`));

