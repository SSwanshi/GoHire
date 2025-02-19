const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);

// Route to render the login/signup page (landing page)
app.get('/', (req, res) => {
  res.render('login', { title: 'Login / Sign Up' });
});

// Route to display the home page after login/signup
app.get('/recruiter/home', (req, res) => {
  res.render('home', { title: 'Recruiter Dashboard' });
});

// Route to add company
app.get('/recruiter/add-company', (req, res) => {
  res.render('add-company', { title: 'Add Company' });
});

// Route to add job
app.get('/recruiter/add-job', (req, res) => {
  res.render('add-job', { title: 'Add Job' });
});

const PORT = 5000;  
app.listen(PORT, () => {
  console.log(`Recruiter server running on http://localhost:${PORT}`);
});
