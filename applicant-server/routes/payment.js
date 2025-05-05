const express = require('express');
const User = require('../models/user');
const premium_user = require('../models/premium_user');
const router = express.Router();

// Render the payment page
router.get('/payment', (req, res) => {
    res.render('payment');
});

// Render the Terms of Service page
router.get('/terms', (req, res) => {
    res.render('terms');
});

// Render the Privacy Policy page
router.get('/privacy', (req, res) => {
    res.render('privacy');
});

// Process payment form submission
router.post('/process-payment', async(req, res) => {
    const { paymentMethod, cardNumber, expiryDate, cvv, cardholderName, bankName, upiId, walletType } = req.body;
    const userId = req.session.user?.id;
    const user = await User.findOne({ userId });

    if (!userId) {
        return res.render('payment', {
          user: req.session.user,
          error: 'Please login to Buy the Premium.'
        });
      }

    const alreadyApplied = await premium_user.findOne({userId});
        if (alreadyApplied) {
            return res.render('payment', {
                user: req.session.user,
                error: 'You are already a premium member!!'
              });
        }

    const application = new premium_user({
          userId,  // Automatically comes from session
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          password: user.password,
          resumeId: user.resumeId,  // Assuming the user has a resume stored
          memberSince: user.memberSince,
          // AppliedAt will automatically be set to current date and time
        });

        await application.save();

    // Create the paymentDetails object
    let paymentDetails = {
        method: paymentMethod,
    };

    // Add payment method-specific details
    if (paymentMethod === 'Credit/Debit Card') {
        paymentDetails.cardNumber = cardNumber ? cardNumber.slice(-4) : null; // Last 4 digits
        paymentDetails.cardholderName = cardholderName || null;
    } else if (paymentMethod === 'Net Banking') {
        paymentDetails.bankName = bankName || null;
    } else if (paymentMethod === 'UPI') {
        paymentDetails.upiId = upiId || null;
    } else if (paymentMethod === 'Wallet') {
        paymentDetails.walletType = walletType || null;
    }

    // Add amount and date (you can customize these as needed)
    const amount = req.body.amount || 0; // Use the actual amount from the form
    const date = new Date().toLocaleDateString(); // Current date

    // Render the receipt page with paymentDetails, amount, and date
    res.render('receipt', { paymentDetails, amount, date });
});

module.exports = router;