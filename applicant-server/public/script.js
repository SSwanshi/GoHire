// Show/hide payment fields based on selected payment method
document.getElementById('paymentMethod').addEventListener('change', function () {
    const paymentMethod = this.value;
    const creditCardFields = document.getElementById('creditCardFields');
    const netBankingFields = document.getElementById('netBankingFields');
    const upiFields = document.getElementById('upiFields');
    const walletFields = document.getElementById('walletFields');

    // Hide all fields initially
    creditCardFields.style.display = 'none';
    netBankingFields.style.display = 'none';
    upiFields.style.display = 'none';
    walletFields.style.display = 'none';

    // Show fields based on selected payment method
    if (paymentMethod === 'creditCard') {
        creditCardFields.style.display = 'block';
    } else if (paymentMethod === 'netBanking') {
        netBankingFields.style.display = 'block';
    } else if (paymentMethod === 'upi') {
        upiFields.style.display = 'block';
    } else if (paymentMethod === 'wallet') {
        walletFields.style.display = 'block';
    }
});

// Update payment amount and hidden input field
document.addEventListener('DOMContentLoaded', () => {
    const subscriptionPlans = document.querySelectorAll('#subscriptionPlans li');
    const paymentAmountInput = document.getElementById('paymentAmount');
    const amountInput = document.getElementById('amount');

    subscriptionPlans.forEach(plan => {
        plan.addEventListener('click', () => {
            const price = plan.getAttribute('data-price');
            console.log('Selected Price:', price); // Debugging
            paymentAmountInput.value = `₹${price}`; // Update visible amount
            amountInput.value = price; // Update hidden input for backend
        });
    });
});

// Form validation
document.getElementById('paymentForm').addEventListener('submit', function (event) {
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!paymentMethod) {
        alert('Please select a payment method.');
        event.preventDefault();
        return;
    }

    if (paymentMethod === 'creditCard') {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardholderName = document.getElementById('cardholderName').value;

        if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
            alert('Please fill out all credit card fields.');
            event.preventDefault();
        } else if (!/^\d{16}$/.test(cardNumber)) {
            alert('Invalid card number. Please enter a 16-digit card number.');
            event.preventDefault();
        } else if (!/^\d{3}$/.test(cvv)) {
            alert('Invalid CVV. Please enter a 3-digit CVV.');
            event.preventDefault();
        }
    } else if (paymentMethod === 'netBanking') {
        const bankName = document.getElementById('bankName').value;
        if (!bankName) {
            alert('Please select a bank.');
            event.preventDefault();
        }
    } else if (paymentMethod === 'upi') {
        const upiId = document.getElementById('upiId').value;
        if (!upiId) {
            alert('Please enter your UPI ID.');
            event.preventDefault();
        }
    } else if (paymentMethod === 'wallet') {
        const walletType = document.getElementById('walletType').value;
        if (!walletType) {
            alert('Please select a wallet.');
            event.preventDefault();
        }
    }
});