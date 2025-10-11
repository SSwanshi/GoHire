const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phone, gender, password, confirmPassword } = req.body;

  try {
    if (!firstName || !lastName || !email || !phone || !gender || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
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

    req.session.successMessage = 'Signed up successfully, please login.';
    res.redirect('/auth/login');

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
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

    req.session.user = {
      id: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      authenticated: true
    };

    await req.session.save();
    console.log(`User ${email} logged in successfully`);
    res.redirect('/');

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
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