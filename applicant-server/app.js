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

const MongoStore = require('connect-mongo');

require("dotenv").config();
const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret',
  resave: false,
  saveUninitialized: false,  // Changed from true to false
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  },
  store: MongoStore.create({  // Add this if you want persistent sessions
    mongoUrl: 'mongodb+srv://gohire:gohire12345678@gohire.kzwudx0.mongodb.net/goHire_applicants?retryWrites=true&w=majority',
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

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

// Root route
app.get('/', (req, res) => {
  res.redirect('/payment'); // Redirect to the payment page
});

// Use payment routes
app.use('/', paymentRoutes);

connectDB();

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));