const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const uploading = require('../middleware/multer');

// Signup POST route moved to API routes for HTML pages

// Login GET route moved to app.js to serve HTML file

// Login POST route moved to API routes for HTML pages

router.get('/user/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/:id/profile-image', uploading.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ 
      success: false, 
      error: "User not found" 
    });

    user.profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    await user.save();
    res.json({ 
      success: true, 
      message: "Profile image updated successfully" 
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Server Error" 
    });
  }
});

router.get('/profile-image/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.profileImage && user.profileImage.data) {
      res.set('Content-Type', user.profileImage.contentType);
      return res.send(user.profileImage.data);
    }
    res.status(404).send("No profile image found");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading image");
  }
});

// Profile GET route moved to app.js to serve HTML file


module.exports = router;