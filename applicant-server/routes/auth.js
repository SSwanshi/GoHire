const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


router.post('/signup', (req, res) => {
  const { firstName, lastName, email, phone, gender, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !phone || !gender || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const existingUser = appUsers.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newUser = { firstName, lastName, email, phone, gender, password };
  appUsers.push(newUser);

  req.session.successMessage = 'Signed up successfully, now login';
  res.redirect('/auth/login');
});

router.get('/login', (req, res) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null;

  res.render('login', { title: 'Login', successMessage });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = appUsers.find(user => user.email === email && user.password === password);

  if (user) {
    req.session.user = user; // Set the user in the session
    res.redirect('/');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

router.get('/user/:email', (req, res) => {
  const { email } = req.params;

  const user = appUsers.find(user => user.email === email);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

module.exports = router;