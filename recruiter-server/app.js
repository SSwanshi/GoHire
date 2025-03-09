const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);


app.get('/', (req, res) => {
  res.redirect('/auth/login',);
});


app.get('/recruiter/home', (req, res) => {
  res.render('home');
});


app.get('/recruiter/add-company', (req, res) => {
  res.render('add-company', { title: 'Add Company' });
});


app.get('/recruiter/add-job', (req, res) => {
  res.render('add-job', { title: 'Add Job' });
});

app.get('/recruiter/add-internship', (req, res) => {
  res.render('add-internship');
});

app.get('/recruiter/reports', (req,res)=> {
  res.render('reports');
});

app.get('/recruiter/internships', (req,res)=> {
  res.render('internships');
});

app.get('/recruiter/companies', (req, res) => {
  const companies = [
    { logo: 'https://logo.clearbit.com/google.com', name: 'Google', date: '2024-06-14' },
    { logo: 'https://logo.clearbit.com/google.com', name: 'Google', date: '2024-06-14' },
  ];
  res.render('companies', { companies });
});

app.get('/recruiter/jobs', (req, res) => {
  res.render('jobs', { title: 'Jobs' });
});

app.get('/recruiter/profile', (req, res) => {
  res.render('profile');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Recruiter server running on http://localhost:${PORT}`);
});
