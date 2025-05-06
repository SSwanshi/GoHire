const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const connectRecruiterDB = require('../config/recruiterDB'); // Import connection setup
const { bucket, gfs } = require('../db/gridfs'); // Ensure this is set up in db/gridfs.js

// 1️⃣ Route to view all companies awaiting verification
router.get('/admin/companies/awaiting-verification', async (req, res) => {
    try {
        // Connect to recruiter DB
        const recruiterConn = await connectRecruiterDB();

        // Dynamically register the Company model with the recruiter connection
        const Company = require('../models/Company')(recruiterConn);  // Pass the connection here

        // Fetch companies that are not verified
        const companies = await Company.find({ verified: false });
        res.render('admin-companies', { companies });
    } catch (error) {
        console.error("Error fetching companies awaiting verification:", error);
        res.status(500).json({ error: "Failed to fetch companies awaiting verification" });
    }
});

// 2️⃣ Route to verify a company (POST)
router.post('/admin/verify-company/:id', async (req, res) => {
    try {
        const companyId = req.params.id;
        const recruiterConn = await connectRecruiterDB();
        const Company = require('../models/Company')(recruiterConn);  // Use the connection here

        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        company.verified = true;
        await company.save();

        res.redirect('/admin/companies/awaiting-verification');
    } catch (error) {
        console.error("Error verifying company:", error);
        res.status(500).json({ error: "Verification failed" });
    }
});

// 3️⃣ Route to download/view proof document
router.get('/company/proof/:proofId', async (req, res) => {
    try {
        // Check if GridFS is initialized
        if (!gfs) {
            return res.status(500).json({ error: "GridFS is not initialized" });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.proofId);
        
        // Fetch the file from GridFS
        const fileData = await gfs.find({ _id: fileId }).toArray();

        if (!fileData || fileData.length === 0) {
            return res.status(404).json({ error: "Proof document not found" });
        }

        const file = fileData[0];
        const readStream = gfs.openDownloadStream(file._id);

        // Set response headers and pipe the file
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
        readStream.pipe(res);
    } catch (error) {
        console.error("Error downloading proof document:", error);
        res.status(500).json({ error: "Failed to download document" });
    }
});



module.exports = router;
