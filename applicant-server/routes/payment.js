const express = require('express');
const User = require('../models/user');
const premium_user = require('../models/premium_user');
const router = express.Router();

// Render the payment page
router.get('/payment', (req, res) => {
    res.render('payment', {
        user: req.session.user,
        error: req.query.error
    });
});

// Render the Terms of Service page
router.get('/terms', (req, res) => {
    res.render('terms');
});

// Render the Privacy Policy page
router.get('/privacy', (req, res) => {
    res.render('privacy');
});

// 🔧 TEMPORARY TEST ROUTE - Add this to test receipt rendering
router.get('/test-receipt', (req, res) => {
    console.log('🔵 Test receipt route called');
    res.render('receipt', {
        paymentDetails: {
            method: 'Credit/Debit Card',
            amount: '1499',
            transactionId: 'TXN123456',
            cardNumber: '1234',
            cardholderName: 'John Doe'
        },
        amount: '1499',
        transactionId: 'TXN123456',
        subscriptionPlan: 'Monthly Premium Plan',
        user: req.session.user
    });
});

// Process payment form submission - UPDATED WITH DEBUGGING
router.post('/process-payment', async(req, res) => {
    try {
        console.log('🔵 Payment processing started...');
        console.log('📦 Request body:', req.body);
        
        // Extract ALL form data including amount and other fields
        const { 
            paymentMethod, 
            amount,  // Make sure this is included
            cardNumber, 
            expiryDate, 
            cvv, 
            cardholderName, 
            bankName, 
            bankUserId,  // Add this
            upiId, 
            upiApp,  // Add this
            upiName  // Add this
        } = req.body;
        
        console.log('💳 Payment method:', paymentMethod);
        console.log('💰 Amount:', amount);
        
        const userId = req.session.user?.id;
        console.log('👤 User ID:', userId);

        if (!userId) {
            console.log('❌ No user ID found - redirecting to payment with error');
            return res.render('payment', {
                user: req.session.user,
                error: 'Please login to Buy the Premium.'
            });
        }

        const user = await User.findOne({ userId });
        console.log('👤 User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('❌ User not found in database');
            return res.render('payment', {
                user: req.session.user,
                error: 'User not found. Please login again.'
            });
        }

        const alreadyApplied = await premium_user.findOne({userId});
        console.log('⭐ Already premium:', alreadyApplied ? 'Yes' : 'No');
        
        if (alreadyApplied) {
            console.log('❌ User already premium member');
            return res.render('payment', {
                user: req.session.user,
                error: 'You are already a premium member!!'
            });
        }

        const application = new premium_user({
            userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            password: user.password,
            resumeId: user.resumeId,
            memberSince: user.memberSince,
        });

        await application.save();
        console.log('✅ Premium user record created');

        // Create COMPLETE paymentDetails object
        let paymentDetails = {
            method: getPaymentMethodDisplayName(paymentMethod),
            amount: amount || '1499', // Default amount if missing
            transactionId: 'TXN' + Date.now(),
            date: new Date().toLocaleString()
        };

        // Add payment method-specific details
        if (paymentMethod === 'creditCard') {
            paymentDetails.cardNumber = cardNumber ? cardNumber.slice(-4) : '****';
            paymentDetails.cardholderName = cardholderName || 'N/A';
            console.log('💳 Card payment details added');
        } else if (paymentMethod === 'netBanking') {
            paymentDetails.bankName = getBankDisplayName(bankName);
            paymentDetails.bankUserId = bankUserId || 'N/A';
            console.log('🏦 Net banking details added');
        } else if (paymentMethod === 'upi') {
            paymentDetails.upiId = upiId || 'N/A';
            paymentDetails.upiApp = getUpiAppDisplayName(upiApp);
            paymentDetails.upiName = upiName || 'N/A';
            console.log('📱 UPI payment details added');
        }

        // Determine subscription plan based on amount
        let subscriptionPlan = 'Monthly Premium Plan';
        if (amount === '5999') {
            subscriptionPlan = '6 Months Premium Plan';
        } else if (amount === '9999') {
            subscriptionPlan = 'Annual Premium Plan';
        }

        console.log('📄 Rendering receipt with data:', {
            paymentDetails,
            amount,
            subscriptionPlan
        });

        // Render receipt with ALL required data
        res.render('receipt', {
            paymentDetails: paymentDetails,
            amount: paymentDetails.amount,
            transactionId: paymentDetails.transactionId,
            subscriptionPlan: subscriptionPlan,
            user: req.session.user
        });

    } catch (error) {
        console.error('❌ Payment processing error:', error);
        console.error('Error stack:', error.stack);
        res.redirect('/payment?error=Payment failed. Please try again.');
    }
});

// Helper functions for display names
function getPaymentMethodDisplayName(method) {
    const methods = {
        'creditCard': 'Credit/Debit Card',
        'netBanking': 'Net Banking',
        'upi': 'UPI'
    };
    return methods[method] || method;
}

function getBankDisplayName(bankCode) {
    const banks = {
        'sbi': 'State Bank of India',
        'hdfc': 'HDFC Bank',
        'icici': 'ICICI Bank',
        'axis': 'Axis Bank'
    };
    return banks[bankCode] || bankCode;
}

function getUpiAppDisplayName(appCode) {
    const apps = {
        'gpay': 'Google Pay',
        'phonepe': 'PhonePe',
        'paytm': 'Paytm',
        'bhim': 'BHIM UPI',
        'other': 'Other UPI App'
    };
    return apps[appCode] || appCode;
}

module.exports = router;