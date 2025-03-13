const express = require('express');
const app = express();
const path = require('path');
const paymentRoutes = require('./routes/payment');

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
    res.redirect('/payment'); // Redirect to the payment page
});

// Use payment routes
app.use('/', paymentRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});