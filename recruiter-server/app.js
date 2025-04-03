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

const app = express();
connectDB(); 

const uploadDir = 'public/uploads/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(async (req, res, next) => {
  if (req.session.user) {
    res.locals.user = await User.findById(req.session.user._id); // Fetch updated user info
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

app.post('/user/upload-profile-image', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.profileImage = '/uploads/profiles/' + req.file.filename;
    await user.save();
    req.session.user = user; 
    
    res.json({ success: true, imageUrl: user.profileImage });
  } catch (error) {
    console.error('Error saving profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image: ' + error.message });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);
app.use('/recruiter', recruiterRoutes);

app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

app.get('/auth/signup', (req, res) => {
  res.render('signup');
});


app.get('/recruiter/home', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  
  try {
    const companyCount = await Company.countDocuments();
    const jobCount = await Job.countDocuments();
    const internshipCount = await Internship.countDocuments();

    res.render('home', {
      title: 'Home',
      user: req.session.user,
      companyCount,
      jobCount,
      internshipCount,
      candidateCount: 250, 
      clientSatisfaction: '98%'
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Server Error');
  }
});


app.get('/recruiter/add-company', (req, res) => {
  res.render('add-company', { title: 'Add Company' });
});

app.get('/recruiter/add-job', async (req, res) => {
  const companies = await Company.find();
  res.render('add-job', { title: 'Add Job', companies });
});

app.get('/recruiter/add-internship', async (req, res) => {
  const companies = await Company.find();
  res.render('add-internship', { title: 'Add Internship', companies });
});

app.get('/recruiter/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  
  const user = await User.findById(req.session.user._id);
  res.render('profile', { title: 'User Profile', user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Recruiter server running on http://localhost:${PORT}`);
});
