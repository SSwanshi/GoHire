const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const router = express.Router();
const upload = require('../utils/storage');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const RecruiterUser = require('../models/User');

// Signup Route
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

    // Optionally set session userId after signup (not required if you're logging in next)
    // req.session.userId = newUser._id;

    req.session.successMessage = 'Signed up successfully, now login';
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login Page
router.get('/login', (req, res) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null;
  res.render('login', { title: 'Login', successMessage });
});

// Login Logic
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    req.session.user = user;
    req.session.userId = user._id; // ✅ Required for image upload

    res.redirect('/recruiter/home');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User by Email
router.get('/user/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, '-password'); // Exclude password field
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/upload-profile', upload.single('profileImage'), async (req, res) => {
  try {
    console.log("Uploaded file:", req.file);

    const userId = req.user?._id || req.session?.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const updatedUser = await RecruiterUser.findByIdAndUpdate(
      userId,
      { profileImage: req.file.id },
      { new: true }
    );

    console.log("Updated user:", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded',
      imageUrl: `/auth/profile-image/${req.file.id}`
    });
  } catch (err) {
    console.error("Error uploading profile image:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.get('/profile-image/:id', async (req, res) => {
  try {
    const conn = mongoose.connection;
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'profileImages',
    });

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    console.error("Image Fetch Error:", error);
    res.status(404).send("Image not found");
  }
});


module.exports = router;
