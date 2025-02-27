const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// Login Page
router.get('/login', (req, res) => {
  res.render('login');
});


// Login Handle
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

// Signup Page
router.get('/signup', (req, res) => {
  res.render('signup');
});


// Signup Handle
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = new User({ name, email, password, role });
  await user.save();
  res.redirect('/login');
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;