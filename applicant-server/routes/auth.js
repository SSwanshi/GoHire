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
    // 1. Validation
    if (!firstName || !lastName || !email || !phone || !gender || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create and save new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      gender,
      password: hashedPassword
    });

    await newUser.save();

    console.log('New user signed up:', newUser);

    // 5. Success message in session and redirect
    req.session.successMessage = 'Signed up successfully, please login.';
    res.redirect('/auth/login');

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Login page
router.get('/login', (req, res) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null;

  res.render('login', { title: 'Login', successMessage });
});

// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     console.log('Fetched User:', user);
//     console.log('Entered password:', password);

//     console.log('User password:', user.password);


//     if (!user || !(await bcrypt.compare(password, user.password))) {
//           return res.status(400).json({ error: 'Invalid email or password' });
//     }

//     req.session.user = {
//       _id: user._id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName
//     };

//     console.log(`User ${email} logged in successfully`);
//     res.redirect('/');

//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Set session consistently - use userId instead of _id
    req.session.user = {
      id: user.userId,  // Changed from _id to userId to match schema
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      authenticated: true  // Add authentication flag
    };

    await req.session.save();  // Explicitly save session
    console.log(`User ${email} logged in successfully`);
    res.redirect('/');  // Redirect to profile after login

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