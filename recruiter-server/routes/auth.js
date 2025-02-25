const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@recruiter.com' && password === 'adminpass') {
    res.redirect('/recruiter/home');
  } else {
    res.send('Invalid credentials');
  }
});

router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  res.redirect('/auth/login'); 
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

module.exports = router;
