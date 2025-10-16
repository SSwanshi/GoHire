const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config(); 

const Company = require('./models/Companies');
const Job = require('./models/Jobs');
const Internship = require('./models/Internship');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const recruiterRoutes = require('./routes/recruiter');
const apiRoutes = require('./routes/api');
const cron = require('node-cron');
const deleteExpiredJobs = require('./routes/jobCleanup');
const deleteExpiredInternship = require('./routes/intCleanup');
const applicationRoutes = require('./routes/applications');
const intapplicationRoutes = require('./routes/internapplicants');


const app = express();
connectDB(); 

const uploadDir = 'public/uploads/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(async (req, res, next) => {
  if (req.session.user) {
    res.locals.user = await User.findById(req.session.user._id); 
  } else {
    res.locals.user = null;
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});


app.use('/auth', authRoutes);
app.use('/recruiter', recruiterRoutes);
app.use('/api', apiRoutes);
app.use('/applications', applicationRoutes);
app.use('/internapplicants', intapplicationRoutes);

app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/auth/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/recruiter/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});


app.get('/logout', (req, res)=> {
  res.redirect('/auth/login');
})


app.get('/recruiter/home', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});



app.get('/recruiter/add-company', (req, res) => {
  res.render('add-company', { isEdit: false, company: {}, user: req.session.user });
});

app.get('/recruiter/add-job', async (req, res) => {
  const companies = await Company.find({ createdBy: req.session.userId });
  res.render('add-job', {
    title: 'Add Job',
    companies,
    isEdit: false,
    job: {},
    user: req.session.user
  });
});


app.get('/recruiter/add-internship', async (req, res) => {
  const companies = await Company.find({ createdBy: req.session.userId });
  res.render('add-internship', {
    title: 'Add Internship',
    companies,
    isEdit: false,
    internship: {},
    user: req.session.user
  });
});


app.get('/recruiter/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  
  const user = await User.findById(req.session.user._id);
  res.render('profile', { title: 'User Profile', user });
});

cron.schedule('0 0 * * *', () => {
  console.log('Running expired jobs cleanup...');
  deleteExpiredJobs();
});
cron.schedule('0 0 * * *', () => {
  console.log('Running expired internships cleanup...');
  deleteExpiredInternship();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Recruiter server running on http://localhost:${PORT}`);
});