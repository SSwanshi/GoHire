const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Companies');
const Job = require('../models/Jobs');
const Internship = require('../models/Internship');
const uploading = require('../middleware/multer');
const router = express.Router();

// Test route to check if API is working
router.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Check if user is logged in
router.get('/auth/check-session', (req, res) => {
  console.log('Session check called, session:', req.session);
  console.log('Session ID:', req.sessionID);
  console.log('Session user:', req.session.user);
  console.log('Session cookie:', req.session.cookie);
  
  if (req.session.user) {
    console.log('User found in session:', req.session.user);
    res.json({
      success: true,
      user: {
        id: req.session.user._id,
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName,
        email: req.session.user.email,
        phone: req.session.user.phone,
        gender: req.session.user.gender,
        profileImage: req.session.user.profileImage
      }
    });
  } else {
    console.log('No user in session');
    res.json({
      success: false,
      message: 'Not logged in'
    });
  }
});

// Login API
router.post('/auth/login', async (req, res) => {
  console.log('Login API called with body:', req.body);
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    req.session.user = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      profileImage: user.profileImage
    };
    req.session.userId = user._id;

    await req.session.save();

    res.json({
      success: true,
      message: 'Login successful',
      redirect: '/recruiter/home'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Signup API
router.post('/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, gender, password, confirmPassword } = req.body;

    // Validation
    if (!firstName || !email || !phone || !gender || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 4 characters long'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be 10 digits'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
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

    res.json({
      success: true,
      message: 'Signed up successfully! Please login.',
      redirect: '/auth/login'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
});

// Logout API
router.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Error logging out'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully',
      redirect: '/auth/login'
    });
  });
});

// Get user profile API
router.get('/user/profile', async (req, res) => {
  try {
    console.log('Profile API called, session:', req.session);
    console.log('Session ID:', req.sessionID);
    console.log('Session user:', req.session.user);
    
    if (!req.session.user) {
      console.log('No user in session for profile API');
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    console.log('User ID from session:', req.session.user._id);
    const user = await User.findById(req.session.user._id);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('User found:', user.firstName, user.email);
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Profile image upload API
router.post('/user/profile-image', uploading.single('image'), async (req, res) => {
  try {
    console.log('Profile image upload called, session:', req.session.user);
    console.log('File received:', req.file);
    
    if (!req.session.user) {
      console.log('No user in session for image upload');
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    await user.save();
    console.log('User saved with new profile image');
    
    // Update session with new profile image
    req.session.user.profileImage = user.profileImage;
    await req.session.save();
    console.log('Session updated with new profile image');

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: user.profileImage
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Update user profile API
router.put('/user/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const { firstName, lastName, phone, gender } = req.body;
    const user = await User.findById(req.session.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;

    await user.save();

    // Update session
    req.session.user = user;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get home page statistics
router.get('/home/statistics', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const companyCount = await Company.countDocuments();
    const jobCount = await Job.countDocuments();
    const internshipCount = await Internship.countDocuments();

    res.json({
      success: true,
      companyCount,
      jobCount,
      internshipCount,
      candidateCount: 50, // Static value as in original
      clientSatisfaction: '98%' // Static value as in original
    });
  } catch (error) {
    console.error('Statistics fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
