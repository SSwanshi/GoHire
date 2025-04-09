const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user'); // We'll need a User model
const bcrypt = require('bcryptjs'); // For password hashing

// Signup page
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Signup POST request
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phone, gender, password, confirmPassword } = req.body;

  try {
    // Validation
    if (!firstName || !lastName || !email || !phone || !gender || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // // Hash password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      gender,
      password
    });

    // Save user to database
    await newUser.save();

    req.session.successMessage = 'Signed up successfully, now login';
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login page
router.get('/login', (req, res) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null;

  res.render('login', { title: 'Login', successMessage });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user (no need to select password since we're not hashing)
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send('Invalid credentials (user not found)');
    }

    // Direct string comparison (INSECURE - only for temporary debugging)
    if (user.password !== password) {
      console.log(`Login failed for ${email}`);
      console.log(`Stored password: ${user.password}`);
      console.log(`Provided password: ${password}`);
      return res.status(401).send('Invalid credentials (password mismatch)');
    }

    // Set user in session
    req.session.user = user;
    console.log(`User ${email} logged in successfully`);
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Get user by email
router.get('/user/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;