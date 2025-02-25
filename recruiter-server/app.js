const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);

// Redirect '/' to '/auth/login'
app.get('/', (req, res) => {
  res.redirect('/auth/login',);
});

// Route to display the home page after login/signup
app.get('/recruiter/home', (req, res) => {
  res.render('home');
});

// Route to add company
app.get('/recruiter/add-company', (req, res) => {
  res.render('add-company', { title: 'Add Company' });
});

// Route to add job
app.get('/recruiter/add-job', (req, res) => {
  res.render('add-job', { title: 'Add Job' });
});

// Route to display companies
app.get('/recruiter/companies', (req, res) => {
  const companies = [
    { logo: 'https://logo.clearbit.com/google.com', name: 'Google', date: '2024-06-14' },
    { logo: 'https://logo.clearbit.com/microsoft.com', name: 'Microsoft', date: '2024-06-14' }
  ];
  res.render('companies', { companies });
});

// Route to display jobs
app.get('/recruiter/jobs', (req, res) => {
  res.render('jobs', { title: 'Jobs' });
});

// Route to display profile
app.get('/recruiter/profile', (req, res) => {
  res.render('profile');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Recruiter server running on http://localhost:${PORT}`);
});
