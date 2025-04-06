const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const router = express.Router();
const upload = require('./uploadMiddleware');
const RecruiterUser = require('../models/User');
const gfs = require('./gridfs');

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phone, gender, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !phone || !gender || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstName, lastName, email, phone, gender, password: hashedPassword });
    await newUser.save();

    req.session.successMessage = 'Signed up successfully, now login';
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/login', (req, res) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null;
  res.render('login', { title: 'Login', successMessage });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    req.session.user = user;
    req.session.userId = user._id; 

    res.redirect('/recruiter/home');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, '-password'); 
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:userId/profile-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await RecruiterUser.findByIdAndUpdate(
      req.params.userId,
      { profileImage: req.file.id },
      { new: true }
    );

    res.redirect('/profile'); // Redirect back to profile page
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get profile image
router.get('/profile-image/:fileId', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const file = await gfs.find({ _id: fileId }).toArray();
    
    if (!file || file.length === 0) {
      return res.status(404).send('File not found');
    }

    gfs.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
