const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const app = express();
const session = require('express-session');
const { companies } = require('./routes/recruiter');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key', // We will work on it later for express session
  resave: false,
  saveUninitialized: true
}));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);
const recruiterRoutes = require('./routes/recruiter');
app.use('/recruiter', recruiterRoutes);


app.get('/', (req, res) => {
  res.redirect('/auth/login',);
});


app.get('/recruiter/home', (req, res) => {
  res.render('home');
});


app.get('/recruiter/add-company', (req, res) => {
  res.render('add-company');
});


app.get('/recruiter/add-job', (req, res) => {
  res.render('add-job', { companies });
});

app.get('/recruiter/add-internship', (req, res) => {
  res.render('add-internship', { companies });
});

app.get('/recruiter/reports', (req,res)=> {
  res.render('reports');
});

app.get('/recruiter/profile', (req, res) => {
  res.render('profile');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Recruiter server running on http://localhost:${PORT}`);
});
