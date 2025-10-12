// Payment method selection handler
document.getElementById('paymentMethod').addEventListener('change', function () {
    const paymentMethod = this.value;
    const creditCardFields = document.getElementById('creditCardFields');
    const netBankingFields = document.getElementById('netBankingFields');
    const upiFields = document.getElementById('upiFields');

    // Hide all payment fields
    creditCardFields.style.display = 'none';
    netBankingFields.style.display = 'none';
    upiFields.style.display = 'none';

    // Clear all errors when switching payment methods
    clearAllErrorMessages();

    // Show selected payment method fields
    if (paymentMethod === 'creditCard') {
        creditCardFields.style.display = 'block';
    } else if (paymentMethod === 'netBanking') {
        netBankingFields.style.display = 'block';
    } else if (paymentMethod === 'upi') {
        upiFields.style.display = 'block';
    }
});

// Subscription plan selection
document.addEventListener('DOMContentLoaded', () => {
    const subscriptionPlans = document.querySelectorAll('#subscriptionPlans li');
    const paymentAmountInput = document.getElementById('paymentAmount');
    const amountInput = document.getElementById('amount');

    subscriptionPlans.forEach(plan => {
        plan.addEventListener('click', () => {
            // Remove selected class from all plans
            subscriptionPlans.forEach(p => p.classList.remove('selected'));
            // Add selected class to clicked plan
            plan.classList.add('selected');
            
            const price = plan.getAttribute('data-price');
            paymentAmountInput.value = `₹${price}`;
            amountInput.value = price;

            // Clear amount validation errors
            clearFieldError('paymentAmount');
        });
    });

    // Initialize real-time validation
    initializeRealTimeValidation();
});

// Enhanced validation functions
function validateCreditCard() {
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const expiryDate = document.getElementById('expiryDate').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    const cardholderName = document.getElementById('cardholderName').value.trim();
    
    clearErrorMessages('creditCardFields');
    
    let isValid = true;
    
    // Validate card number (16 digits only - NO Luhn algorithm)
    if (!cardNumber) {
        showError('cardNumber', 'Card number is required');
        isValid = false;
    } else {
        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        if (!/^\d{16}$/.test(cleanCardNumber)) {
            showError('cardNumber', 'Please enter a valid 16-digit card number');
            isValid = false;
        }
        // Luhn algorithm validation REMOVED
    }
    
    // Validate expiry date (MM/YY format)
    if (!expiryDate) {
        showError('expiryDate', 'Expiry date is required');
        isValid = false;
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        showError('expiryDate', 'Please enter expiry date in MM/YY format');
        isValid = false;
    } else {
        // Check if card is expired
        const [month, year] = expiryDate.split('/');
        const expiry = new Date(2000 + parseInt(year), parseInt(month));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expiry <= today) {
            showError('expiryDate', 'Card has expired');
            isValid = false;
        }
    }
    
    // Validate CVV (3 or 4 digits)
    if (!cvv) {
        showError('cvv', 'CVV is required');
        isValid = false;
    } else if (!/^\d{3,4}$/.test(cvv)) {
        showError('cvv', 'Please enter a valid CVV (3-4 digits)');
        isValid = false;
    }
    
    // Validate cardholder name
    if (!cardholderName) {
        showError('cardholderName', 'Cardholder name is required');
        isValid = false;
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(cardholderName)) {
        showError('cardholderName', 'Please enter a valid cardholder name (2-50 letters and spaces only)');
        isValid = false;
    }
    
    return isValid;
}

function validateNetBanking() {
    const bankName = document.getElementById('bankName').value;
    const bankUserId = document.getElementById('bankUserId').value.trim();
    const bankPassword = document.getElementById('bankPassword').value;
    
    clearErrorMessages('netBankingFields');
    
    let isValid = true;
    
    // Validate bank selection
    if (!bankName || bankName === '') {
        showError('bankName', 'Please select a bank');
        isValid = false;
    }
    
    // Validate Bank User ID - IMPROVED VALIDATION (REQUIRES 2+ LETTERS & 1+ NUMBER)
    if (!bankUserId) {
        showError('bankUserId', 'Bank User ID is required');
        isValid = false;
    } else if (bankUserId.length < 4) {
        showError('bankUserId', 'Bank User ID must be at least 4 characters long');
        isValid = false;
    } else if (bankUserId.length > 20) {
        showError('bankUserId', 'Bank User ID cannot exceed 20 characters');
        isValid = false;
    } else if (!/^(?=.*[a-zA-Z].*[a-zA-Z])(?=.*\d)[a-zA-Z0-9@._-]{4,20}$/.test(bankUserId)) {
        showError('bankUserId', 'Bank User ID must contain at least 2 letters and 1 number, and can include @ . _ -');
        isValid = false;
    } else if (/^[^a-zA-Z]/.test(bankUserId)) {
        showError('bankUserId', 'Bank User ID must start with a letter');
        isValid = false;
    }
    
    // Validate Bank Password
    if (!bankPassword) {
        showError('bankPassword', 'Password is required');
        isValid = false;
    } else if (bankPassword.length < 6) {
        showError('bankPassword', 'Password must be at least 6 characters long');
        isValid = false;
    } else if (bankPassword.length > 20) {
        showError('bankPassword', 'Password cannot exceed 20 characters');
        isValid = false;
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/.test(bankPassword)) {
        showError('bankPassword', 'Password must contain both letters and numbers');
        isValid = false;
    }
    
    return isValid;
}

function validateUPI() {
    const upiId = document.getElementById('upiId').value.trim();
    const upiName = document.getElementById('upiName').value.trim();
    const upiApp = document.getElementById('upiApp').value;
    const upiPassword = document.getElementById('upiPassword').value;
    
    clearErrorMessages('upiFields');
    
    let isValid = true;
    
    // Validate UPI ID format - STRICTER VALIDATION
    if (!upiId) {
        showError('upiId', 'UPI ID is required');
        isValid = false;
    } else if (!/^[a-zA-Z][a-zA-Z0-9.\-_]{2,19}@(ybl|oksbi|okicici|okhdfcbank|okaxis|paytm|apl|phonepe)$/i.test(upiId)) {
        showError('upiId', 'Please enter a valid UPI ID (e.g., username@ybl, username@paytm, username@oksbi)');
        isValid = false;
    }
    
    // Validate UPI Name
    if (!upiName) {
        showError('upiName', 'Name is required');
        isValid = false;
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(upiName)) {
        showError('upiName', 'Please enter a valid name (2-50 letters and spaces only)');
        isValid = false;
    }
    
    // Validate UPI App selection
    if (!upiApp || upiApp === '') {
        showError('upiApp', 'Please select a UPI app');
        isValid = false;
    }
    
    // Validate UPI Password/PIN
    if (!upiPassword) {
        showError('upiPassword', 'UPI PIN is required');
        isValid = false;
    } else if (!/^\d{4,6}$/.test(upiPassword)) {
        showError('upiPassword', 'UPI PIN must be 4-6 digits');
        isValid = false;
    }
    
    return isValid;
}

function validateAmount() {
    const amount = document.getElementById('amount').value;
    const paymentAmount = document.getElementById('paymentAmount').value;
    
    clearFieldError('paymentAmount');
    
    if (!amount || amount === '0' || amount === '' || !paymentAmount) {
        showError('paymentAmount', 'Please select a subscription plan');
        return false;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        showError('paymentAmount', 'Please select a valid subscription plan');
        return false;
    }
    
    return true;
}

function validatePaymentMethod() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    clearFieldError('paymentMethod');
    
    if (!paymentMethod) {
        showError('paymentMethod', 'Please select a payment method');
        return false;
    }
    return true;
}

// Enhanced helper functions
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error for this field
    clearFieldError(fieldId);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
    field.classList.add('error');
    field.classList.remove('valid');
}

function showSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('error');
        field.classList.add('valid');
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const errorDiv = field.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.classList.remove('error');
}

function clearErrorMessages(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const errorMessages = section.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    
    const inputs = section.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.classList.remove('error');
        input.classList.remove('valid');
    });
}

function clearAllErrorMessages() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('input, select').forEach(field => {
        field.classList.remove('error');
        field.classList.remove('valid');
    });
}

// Real-time validation initialization
function initializeRealTimeValidation() {
    // Card number formatting and validation
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            // Format card number with spaces
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            e.target.value = formattedValue.substring(0, 19);
            
            // Real-time validation - only check for 16 digits
            const cleanValue = value.substring(0, 16);
            if (cleanValue.length === 16) {
                showSuccess('cardNumber');
            }
        });
        
        cardNumber.addEventListener('blur', function() {
            const value = this.value.replace(/\s/g, '');
            if (value.length > 0 && !/^\d{16}$/.test(value)) {
                showError('cardNumber', 'Please enter a valid 16-digit card number');
            }
        });
    }
    
    // Expiry date formatting
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                e.target.value = value;
            }
        });
        
        expiryDate.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
                showError('expiryDate', 'Please enter expiry date in MM/YY format');
            }
        });
    }
    
    // CVV validation
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }
    
    // Bank User ID validation
    const bankUserId = document.getElementById('bankUserId');
    if (bankUserId) {
        bankUserId.addEventListener('input', function(e) {
            const value = e.target.value;
            e.target.value = value.replace(/[^a-zA-Z0-9@._-]/g, '');
            clearFieldError('bankUserId');
        });
    }
    
    // UPI ID validation
    const upiId = document.getElementById('upiId');
    if (upiId) {
        upiId.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && !/^[a-zA-Z][a-zA-Z0-9.\-_]{2,19}@(ybl|oksbi|okicici|okhdfcbank|okaxis|paytm|apl|phonepe)$/i.test(value)) {
                showError('upiId', 'Please enter a valid UPI ID');
            }
        });
    }
    
    // UPI PIN validation
    const upiPassword = document.getElementById('upiPassword');
    if (upiPassword) {
        upiPassword.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
        });
    }
}

// Net Banking simulation with enhanced validation
document.getElementById('processNetBanking')?.addEventListener('click', function (e) {
    e.preventDefault();
    
    if (!validateNetBanking() || !validateAmount()) {
        return;
    }

    // Submit the form instead of simulating
    document.getElementById('paymentForm').submit();
});

// Main form submission handler
document.getElementById('paymentForm').addEventListener('submit', function (event) {
    console.log('🔵 Form submission started...');
    
    // Clear all previous errors
    clearAllErrorMessages();
    
    let isValid = true;
    
    // Validate payment method selection
    if (!validatePaymentMethod()) {
        isValid = false;
    }
    
    // Validate amount
    if (!validateAmount()) {
        isValid = false;
    }
    
    // Validate specific payment method fields
    const paymentMethod = document.getElementById('paymentMethod').value;
    console.log('💳 Selected payment method:', paymentMethod);
    
    if (paymentMethod === 'creditCard') {
        if (!validateCreditCard()) {
            isValid = false;
        }
    } else if (paymentMethod === 'netBanking') {
        if (!validateNetBanking()) {
            isValid = false;
        }
    } else if (paymentMethod === 'upi') {
        if (!validateUPI()) {
            isValid = false;
        }
    }
    
    console.log('✅ Form validation result:', isValid);
    
    // If validation fails, prevent form submission and show errors
    if (!isValid) {
        event.preventDefault();
        console.log('❌ Form validation failed - preventing submission');
        return;
    }
    
    console.log('✅ Form validation passed - allowing submission');
    
    // If validation passes, show loading state but DON'T prevent submission
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading"></span> Processing Payment...';
    submitButton.disabled = true;
    
    // The form will now submit to your backend and show the receipt
    // DON'T call event.preventDefault() when validation passes!
});