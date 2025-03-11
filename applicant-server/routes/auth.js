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


router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});


router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  res.redirect('/auth/login');
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;