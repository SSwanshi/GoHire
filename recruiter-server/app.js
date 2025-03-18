const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const recruiterRoutes = require('./routes/recruiter');
const { companies } = require('./routes/recruiter');
const { jobs } = require('./routes/recruiter');
const { internships } = require('./routes/recruiter');
const { users } = require('./routes/auth'); 
const seedDatabase = require('./seed');

const app = express();
seedDatabase();

// Ensure uploads directory exists
const uploadDir = 'public/uploads/profiles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware for sessions (Place it before accessing req.session)
app.use(session({
  secret: 'your-secret-key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware to make user available in templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer storage configuration for profile images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/profiles/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Route to handle profile image upload
app.post('/user/upload-profile-image', upload.single('profileImage'), (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const userEmail = req.session.user.email;
    const userIndex = users.findIndex(u => u.email === userEmail);
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const imagePath = '/uploads/profiles/' + req.file.filename;
    users[userIndex].profileImage = imagePath;
    req.session.user = users[userIndex]; // Update session user
    
    res.json({ success: true, imageUrl: imagePath });
  } catch (error) {
    console.error('Error saving profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image: ' + error.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/recruiter', recruiterRoutes);

// Home Route (Redirect to login if not logged in)
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

app.get('/auth/signup', (req, res) => {
  res.render('signup');
});

// Recruiter Routes (Ensure user is logged in)
app.get('/recruiter/home', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login'); 
  res.render('home', { title: 'Home', user: req.session.user, companies,jobs,internships });
});

app.get('/recruiter/add-company', (req, res) => {
  res.render('add-company', { title: "Add Company" });
});

app.get('/recruiter/add-job', (req, res) => {
  res.render('add-job', { title: "Add Job", companies });
});

app.get('/recruiter/add-internship', (req, res) => {
  res.render('add-internship', { title: "Add Internship", companies });
});


app.get('/recruiter/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login'); 
  res.render('profile', { title: 'User Profile', user: req.session.user });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Recruiter server running on http://localhost:${PORT}`);
});
