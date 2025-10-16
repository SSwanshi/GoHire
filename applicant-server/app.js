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
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  },
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://gohire:gohire12345678@gohire.kzwudx0.mongodb.net/goHire_applicants?retryWrites=true&w=majority',
    ttl: 14 * 24 * 60 * 60
  })
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(passport.initialize());
app.use(passport.session());
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use('/profile', profileRoutes);

app.get('/', (req, res) => {
  res.render('home', {
    user: req.session.user
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});
app.use('/auth', authRoutes);
app.use('/', applicantRoutes);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/signup.html'));
});

app.get('/', (req, res) => {
  res.redirect('/payment');
});
app.use('/', paymentRoutes);

connectDB();

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));