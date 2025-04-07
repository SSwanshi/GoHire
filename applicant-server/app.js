const express = require('express');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const multer = require('multer');

const authRoutes = require('./routes/auth');
const appUsers = require('./routes/auth');
const applicantRoutes = require('./routes/applicant');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payment');
const { connectDB, getGfs } = require('./config/db');

require("dotenv").config();
const app = express();

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

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(passport.initialize());
app.use(passport.session()); // If using Passport for authentication

app.use('/profile', profileRoutes);

// In your app.js or routes file where you render the home page
app.get('/', (req, res) => {
  res.render('home', {
    user: req.session.user
  });
});

// Or add middleware to make user available to all templates

app.get('/logout', (req, res) => {
  // Clear the user session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/'); // Redirect to homepage after logout
  });
});

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
  const user = req.session.user || {
    firstName: 'Anuj',
    lastName: 'Rathore',
    email: 'anuj.r23@iiits.in',
    phone: '9340041042',
    gender: 'Male',
    memberSince: 'March 2025'
  };

  const resumeData = {}; // Fetch resume data from DB

  res.render('profile', {
    appUsers,
    user,
    resumeData,
    title: 'User Profile - GoHire'
  });
});

// Root route
app.get('/', (req, res) => {
  res.redirect('/payment'); // Redirect to the payment page
});

// Use payment routes
app.use('/', paymentRoutes);

connectDB();

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
