const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Company = require("../models/Companies");
const Job = require("../models/Jobs");
const Internship = require("../models/Internship");
const { Application, InternshipApplication } = require("../../applicant-server/models/Application");
const { GridFSBucket } = require("mongodb");

const router = express.Router();

const conn = mongoose.connection;
let bucket;
conn.once("open", () => {
    bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("✅ GridFS Bucket Initialized");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/add-company", upload.single("logo"), async (req, res) => {
    try {
        const { companyName, website, location } = req.body;
        if (!companyName || !website || !location) {
            return res.status(400).json({ error: "All fields are required" });
        }
        
        let logoId = null;
        if (req.file) {
            const uploadStream = bucket.openUploadStream(req.file.originalname);
            uploadStream.end(req.file.buffer);
            logoId = uploadStream.id;
        }

        const newCompany = new Company({
            companyName: companyName.trim(),
            website: website.trim(),
            location: location.trim(),
            logoId,
        });

        await newCompany.save();

        req.session.successMessage = "Company added successfully!";
        res.redirect("/recruiter/companies"); 
    } catch (error) {
        console.error("Error adding company:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to add company" });
        }
    }
});


// route for updating company details

router.post("/add-job", async (req, res) => {
    try {
        const { jobTitle, jobDescription, jobRequirements, jobSalary, jobLocation, jobType, jobExperience, noofPositions, jobCompany } = req.body;
        
        console.log("Received Job Data:", req.body);

        if (!jobTitle || !jobDescription || !jobRequirements || !jobSalary || !jobLocation || !jobType || !jobExperience || !noofPositions || !jobCompany) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const companyExists = await Company.findById(jobCompany);
        if (!companyExists) {
            return res.status(400).json({ error: "Invalid Company ID" });
        }

        const newJob = new Job({
            jobTitle,
            jobDescription,
            jobRequirements,
            jobSalary: parseFloat(jobSalary),
            jobLocation,
            jobType,
            jobExperience: parseInt(jobExperience),
            noofPositions: parseInt(noofPositions),
            jobCompany: new mongoose.Types.ObjectId(jobCompany)
        });

        await newJob.save();
        console.log("Job Saved Successfully:", newJob);

        req.session.successMessage = "Job added successfully!";
        
        res.redirect("/recruiter/jobs");
    } catch (error) {
        console.error("Error adding job:", error);
        res.status(500).json({ error: "Failed to add job" });
    }
});

// Serve logo images from GridFS
router.get("/logo/:id", async (req, res) => {
    try {
        const logoId = new mongoose.Types.ObjectId(req.params.id);
        
        // Check if the file exists
        const fileExists = await conn.db.collection("uploads.files").findOne({ _id: logoId });
        if (!fileExists) {
            console.log("⚠️ File Not Found:", logoId);
            return res.status(404).json({ error: "Image not found" });
        }

        // Stream the file
        const downloadStream = bucket.openDownloadStream(logoId);
        res.set("Content-Type", fileExists.contentType || "image/png");
        downloadStream.pipe(res);
    } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).json({ error: "Failed to retrieve image" });
    }
});


router.get('/companies', async (req, res) => {
    try {
        const companies = await Company.find();

        const successMessage = req.session.successMessage;
        req.session.successMessage = null; 

        res.render('companies', { companies, successMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Companies' });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().populate("jobCompany");

        const successMessage = req.session.successMessage;
        req.session.successMessage = null; 

        res.render('jobs', { jobs, successMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});


router.post('/add-internship', async (req, res) => {
    try {
        const { intTitle, intDescription, intRequirements, intStipend, intLocation, 
                intDuration, intExperience, intPositions, intCompany } = req.body;
        
        console.log("Received Internship Data:", req.body);

        if (!intTitle || !intDescription || !intRequirements || !intStipend || 
            !intLocation || !intDuration || !intExperience || !intPositions || !intCompany) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const companyExists = await Company.findOne({ companyName: intCompany });
        if (!companyExists) {
            return res.status(400).json({ error: "Company not found" });
        }
        
        const newInternship = new Internship({
            intTitle,
            intDescription,
            intRequirements,
            intStipend: parseFloat(intStipend),
            intLocation,
            intDuration,
            intExperience: parseInt(intExperience),
            intPositions: parseInt(intPositions),
            intCompany: companyExists._id  
        });
        
        await newInternship.save();
        console.log("Internship Saved Successfully:", newInternship);

        req.session.successMessage = "Internship added successfully!";
        res.redirect('/recruiter/internships');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add internship' });
    }
});

router.get('/internships', async (req, res) => {
    try {
        const internships = await Internship.find().populate("intCompany");

        const successMessage = req.session.successMessage;
        req.session.successMessage = null;

        res.render('internships', { internships, successMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch internships' });
    }
});

router.post('/delete-company/:companyId', async (req, res) => {
    try {
        await Company.findByIdAndDelete(req.params.companyId);
        res.redirect('/recruiter/companies');
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

router.post('/delete-job/:jobId', async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.jobId);
        res.redirect('/recruiter/jobs');
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

router.post('/delete-intern/:intId', async (req, res) => {
    try {
        await Internship.findByIdAndDelete(req.params.intId);
        res.redirect('/recruiter/internships');
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete internship' });
    }
});

router.post('/applicant-job/:jobId', async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        const applications = await Application.find({ jobTitle: job.jobTitle });
        res.render('applications', { job, applications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

router.post('/applicant-intern/:intId', async (req, res) => {
    try {
        const intern = await Internship.findById(req.params.intId);
        const intapplications = await InternshipApplication.find({ intTitle: intern.intTitle });
        res.render('intapplication', { intern, intapplications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch internship applications' });
    }
});

module.exports = router;
