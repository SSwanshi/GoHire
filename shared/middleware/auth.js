const passport = require('passport');

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Middleware to check if the user is logged in and has a specific role (e.g., 'admin')
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.redirect('/login');
}

// Middleware to handle login status
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  return next();
}

module.exports = {
  ensureAuthenticated,
  isAdmin,
  checkNotAuthenticated
};
