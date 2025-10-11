document.getElementById('paymentMethod').addEventListener('change', function () {
    const paymentMethod = this.value;
    const creditCardFields = document.getElementById('creditCardFields');
    const netBankingFields = document.getElementById('netBankingFields');
    const upiFields = document.getElementById('upiFields');

    creditCardFields.style.display = 'none';
    netBankingFields.style.display = 'none';
    upiFields.style.display = 'none';

    if (paymentMethod === 'creditCard') creditCardFields.style.display = 'block';
    else if (paymentMethod === 'netBanking') netBankingFields.style.display = 'block';
    else if (paymentMethod === 'upi') upiFields.style.display = 'block';
});

document.addEventListener('DOMContentLoaded', () => {
    const subscriptionPlans = document.querySelectorAll('#subscriptionPlans li');
    const paymentAmountInput = document.getElementById('paymentAmount');
    const amountInput = document.getElementById('amount');

    subscriptionPlans.forEach(plan => {
        plan.addEventListener('click', () => {
            const price = plan.getAttribute('data-price');
            paymentAmountInput.value = `₹${price}`;
            amountInput.value = price;
        });
    });
});

document.getElementById('processNetBanking').addEventListener('click', function () {
    const bankName = document.getElementById('bankName').value;
    const bankUserId = document.getElementById('bankUserId').value;
    const bankPassword = document.getElementById('bankPassword').value;
    const amount = document.getElementById('amount').value;
    const summary = document.getElementById('transactionSummary');

    if (!bankName || !bankUserId || !bankPassword) {
        alert('Please fill all Net Banking fields.');
        return;
    }

    setTimeout(() => {
        summary.value = `Bank: ${bankName.toUpperCase()}\n` +
                        `User ID: ${bankUserId}\n` +
                        `Amount Paid: ₹${amount}\n` +
                        `Transaction ID: TXN${Date.now()}\n` +
                        `Status: SUCCESS`;
        alert('Payment Successful via Net Banking!');
    }, 1000);
});

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
        }
    } else if (paymentMethod === 'netBanking') {
        const bankName = document.getElementById('bankName').value;
        if (!bankName) {
            alert('Please select a bank.');
            event.preventDefault();
        }
    } else if (paymentMethod === 'upi') {
        const upiId = document.getElementById('upiId').value;
        const upiName = document.getElementById('upiName').value;
        const upiApp = document.getElementById('upiApp').value;
        const upiPassword = document.getElementById('upiPassword').value;
        if (!upiName || !upiId || !upiPassword || !upiApp) {
            alert('Please fill out all UPI fields.');
            event.preventDefault();
        }
    }
});
