const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const multer = require('multer');

const authRoutes = require('./routes/auth');
const applicantRoutes = require('./routes/applicant');
const profileRoutes = require('./routes/profile');

const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(passport.initialize());
app.use(passport.session()); // If using Passport for authentication

app.use('/profile', profileRoutes);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/profiles/';
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Temporary users array (Replace with database query)
const users = [];

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

// Profile Image Upload
app.post('/user/upload-profile-image', upload.single('profileImage'), (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const userEmail = req.session.user.email;
    const userIndex = users.findIndex(u => u.email === userEmail);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const imagePath = '/uploads/profiles/' + req.file.filename;
    users[userIndex].profileImage = imagePath;
    req.session.user = users[userIndex]; // Update session user data

    res.json({ success: true, imageUrl: imagePath });
  } catch (error) {
    console.error('Error saving profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image: ' + error.message });
  }
});

// Serve uploaded profile images
app.use('/uploads/profiles', express.static(path.join(__dirname, 'public/uploads/profiles')));

// Profile Page
app.get('/profile', (req, res) => {
  const userData = req.session.user || {};
  const resumeData = {}; // Fetch resume data from DB

  res.render('profile', {
    userData,
    resumeData,
    title: 'User Profile - GoHire'
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
