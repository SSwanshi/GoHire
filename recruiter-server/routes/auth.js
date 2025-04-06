const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const router = express.Router();
const uploading = require('../middleware/multer');

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
router.post('/:id/profile-image', uploading.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    user.profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    await user.save();
    res.redirect('/auth/profile');
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send("Server Error");
  }
});

router.get('/profile-image/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.profileImage && user.profileImage.data) {
      res.set('Content-Type', user.profileImage.contentType);
      return res.send(user.profileImage.data);
    }
    res.status(404).send("No profile image found");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading image");
  }
});

router.get('/profile', async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) return res.redirect('/auth/login');

    const user = await User.findById(userId);
    res.render('profile', { user }); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


module.exports = router;