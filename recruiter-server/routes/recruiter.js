const express = require('express');
const router = express.Router();
const { addCompany, addJob } = require('../controllers/recruiterController');


router.get('/add-company', (req, res) => res.render('add-company'));
router.post('/add-company', addCompany);

router.get('/add-job', (req, res) => res.render('add-job'));
router.post('/add-job', addJob);

module.exports = router;
