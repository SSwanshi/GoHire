const express = require('express');
const router = express.Router();
const passport = require('passport');
// const User = require('../models/user');

router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

const appUsers = [
  { firstName: "Sarvjeet", lastName: "Swanshi", email: "sarvjeetswanshi@gmail.com", phone: "8102109959", gender: "male", password: "adminpass" },
  { firstName: "Saurav", lastName: "Roy", email: "sauravroy@gmail.com", phone: "9854672132", gender: "male", password: "adminpass" }
];

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

  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  req.session.user = user;

  res.redirect('/');
});

module.exports = appUsers;
module.exports = router ;