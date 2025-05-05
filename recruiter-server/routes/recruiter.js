const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Company = require("../models/Companies");
const Job = require("../models/Jobs");
const User = require("../models/User");
const Internship = require("../models/Internship");
const { Application, InternshipApplication } = require("../../applicant-server/models/Application");
const { GridFSBucket } = require("mongodb");
const { GridFsStorage } = require("multer-gridfs-storage");
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

const router = express.Router();

const conn = mongoose.connection;
let bucket;
conn.once("open", () => {
    bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("✅ GridFS Bucket Initialized");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// const storage_image = new GridFsStorage({
//     url: process.env.MONGO_URI_RECRUITERS,
//     file: (req, file) => {
//         return {
//             filename: `profile_${Date.now()}_${file.originalname}`,
//             bucketName: "uploads"
//         };
//     }
// });


router.post("/add-company", upload.fields([{ name: "logo" }, { name: "proofDocument" }]), async (req, res) => {
    try {
        const { companyName, website, location } = req.body;

        // Check if required fields are filled
        if (!companyName || !website || !location) {
            return res.status(400).json({ error: "All fields are required" });
        }

        let logoId = null;
        if (req.files && req.files.logo) {
            const uploadStream = bucket.openUploadStream(req.files.logo[0].originalname);
            uploadStream.end(req.files.logo[0].buffer);
            logoId = uploadStream.id;
        }

        let proofDocumentId = null;
        if (req.files && req.files.proofDocument) {
            const uploadStream = bucket.openUploadStream(req.files.proofDocument[0].originalname);
            uploadStream.end(req.files.proofDocument[0].buffer);
            proofDocumentId = uploadStream.id;
        }

        const newCompany = new Company({
            companyName: companyName.trim(),
            website: website.trim(),
            location: location.trim(),
            logoId,
            proofDocumentId,   // Store the proof document ID here
            createdBy: req.session.userId,
            verified: false      // Set to false by default, admin will verify later
        });

        await newCompany.save();

        req.session.successMessage = "Company added successfully, awaiting verification!";
        res.redirect("/recruiter/companies");
    } catch (error) {
        console.error("Error adding company:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to add company" });
        }
    }
});


router.post("/add-job", async (req, res) => {
    try {
        const {
            jobTitle,
            jobDescription,
            jobRequirements,
            jobSalary,
            jobLocation,
            jobType,
            jobExperience,
            noofPositions,
            jobCompany,
            jobExpiry
        } = req.body;

        const userId = req.session.userId;

        console.log("Received Job Data:", req.body);

        if (
            !jobTitle || !jobDescription || !jobRequirements || !jobSalary ||
            !jobLocation || !jobType || !jobExperience || !noofPositions || !jobCompany || !jobExpiry
        ) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const companyExists = await Company.findOne({
            _id: jobCompany,
            createdBy: userId,
            verified: true  // ✅ Only allow verified companies
        });

        if (!companyExists) {
            return res.status(400).json({ error: "Company must be verified to post a job." });
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
            jobCompany: new mongoose.Types.ObjectId(jobCompany),
            createdBy: userId,
            jobExpiry 
        });

        await newJob.save();
        console.log("✅ Job Saved Successfully:", newJob);

        req.session.successMessage = "Job added successfully!";
        res.redirect("/recruiter/jobs");

    } catch (error) {
        console.error("❌ Error adding job:", error);
        res.status(500).json({ error: "Failed to add job" });
    }
});


router.get("/logo/:id", async (req, res) => {
    try {
        const logoId = new mongoose.Types.ObjectId(req.params.id);

        const fileExists = await conn.db.collection("uploads.files").findOne({ _id: logoId });
        if (!fileExists) {
            console.log("⚠️ File Not Found:", logoId);
            return res.status(404).json({ error: "Image not found" });
        }

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
        const companies = await Company.find({ createdBy: req.session.userId });

        const successMessage = req.session.successMessage;
        req.session.successMessage = null;

        res.render('companies', { companies, successMessage, user:req.session.user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Companies' });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find({ createdBy: req.session.userId }).populate("jobCompany");

        const successMessage = req.session.successMessage;
        req.session.successMessage = null;

        res.render('jobs', { jobs, successMessage, user:req.session.user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});


router.post('/add-internship', async (req, res) => {
    try {
        const {
            intTitle,
            intDescription,
            intRequirements,
            intStipend,
            intLocation,
            intDuration,
            intExperience,
            intPositions,
            intCompany,
            intExpiry
        } = req.body;

        console.log("Received Internship Data:", req.body);

        if (!intTitle || !intDescription || !intRequirements || !intStipend ||
            !intLocation || !intDuration || !intExperience || !intPositions || !intCompany || !intExpiry) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const companyExists = await Company.findOne({
            _id: intCompany,
            createdBy: req.session.userId,
            verified: true // ✅ Only allow verified companies
        });

        if (!companyExists) {
            return res.status(400).json({ error: "Company must be verified to post an internship." });
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
            intCompany: companyExists._id,
            createdBy: req.session.userId,
            intExpiry
        });

        await newInternship.save();
        console.log("✅ Internship Saved Successfully:", newInternship);

        req.session.successMessage = "Internship added successfully!";
        res.redirect('/recruiter/internships');
    } catch (error) {
        console.error("❌ Error adding internship:", error);
        res.status(500).json({ error: 'Failed to add internship' });
    }
});


router.get('/internships', async (req, res) => {
    try {
        const internships = await Internship.find({ createdBy: req.session.userId }).populate("intCompany");

        const successMessage = req.session.successMessage;
        req.session.successMessage = null;

        res.render('internships', { internships, successMessage, user:req.session.user });
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



router.get("/edit-company/:id", async (req, res) => {
    const company = await Company.findById(req.params.id);
    res.render("add-company", { company, isEdit: true, user: req.session.user });
  });
  

  router.post("/edit-company/:id", upload.single("logo"), async (req, res) => {
    const { companyName, website, location } = req.body;
    
    const updateData = {
        companyName: companyName.trim(),  // optional: can remove if you want it fixed
        website: website.trim(),
        location: location.trim()
    };

    // Only update logo if a new one is uploaded
    if (req.file) {
        const uploadStream = bucket.openUploadStream(req.file.originalname);
        uploadStream.end(req.file.buffer);
        updateData.logoId = uploadStream.id;
    }

    // Prevent proofDocumentId from being changed
    delete req.body.proofDocumentId;

    await Company.findByIdAndUpdate(req.params.id, updateData);
    req.session.successMessage = "Company updated successfully!";
    res.redirect("/recruiter/companies");
});


  

  router.get("/edit-job/:id", async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate("jobCompany");
        const companies = await Company.find({ createdBy: req.session.userId });

        if (!job) {
            req.session.errorMessage = "Job not found.";
            return res.redirect("/recruiter/jobs");
        }

        res.render("add-job", {
            job,
            companies,
            isEdit: true,
            user: req.session.user
        });
    } catch (err) {
        console.error("Error loading edit job page:", err);
        req.session.errorMessage = "Something went wrong.";
        res.redirect("/recruiter/jobs");
    }
});


router.post("/edit-job/:id", async (req, res) => {
    try {
        const {
            jobTitle,
            jobDescription,
            jobRequirements,
            jobSalary,
            jobLocation,
            jobType,
            jobExperience,
            noofPositions,
            jobCompany,
            jobExpiry
        } = req.body;

        const updateData = {
            jobTitle,
            jobDescription,
            jobRequirements,
            jobSalary: parseFloat(jobSalary),
            jobLocation,
            jobType,
            jobExperience: parseInt(jobExperience),
            noofPositions: parseInt(noofPositions),
            jobCompany,
            jobExpiry
        };

        await Job.findByIdAndUpdate(req.params.id, updateData);

        req.session.successMessage = "Job updated successfully!";
        res.redirect("/recruiter/jobs");
    } catch (err) {
        console.error("Error updating job:", err);
        req.session.errorMessage = "Failed to update job.";
        res.redirect("/recruiter/jobs");
    }
});

router.get('/edit-internship/:id', async (req, res) => {
    const internshipId = req.params.id;
  
    try {
      const internship = await Internship.findById(internshipId).populate('intCompany');
      const companies = await Company.find({ createdBy: req.session.userId });
  
      if (!internship) {
        req.session.errorMessage = "Job not found";
        return res.redirect('/recruiter/internships');
      }
  
      res.render('add-internship', {
        internship,
        companies,
        isEdit: true,
        user: req.session.user
      });
    } catch (err) {
      console.error('Error loading internship edit page:', err);
      req.session.errorMessage = "Failed to update internship.";
      res.redirect('/recruiter/internships');
    }
  });

  router.post('/edit-internship/:id', async (req, res) => {
    const internshipId = req.params.id;
  
    const {
        intTitle,
        intDescription,
        intRequirements,
        intStipend,
        intLocation,
        intDuration,
        intExperience,
        intPositions,
        intCompany,
        intExpiry
    } = req.body;
  
    try {
      const updatedInternship = await Internship.findByIdAndUpdate(
        internshipId,
        {
            intTitle,
            intDescription,
            intRequirements,
            intStipend,
            intLocation,
            intDuration,
            intExperience,
            intPositions,
            intCompany,
            intExpiry
        },
        { new: true }
      );
  
      if (!updatedInternship) {
        req.session.errorMessage = "Failed to update internship.";
        return res.redirect('/recruiter/internships');
      }
  
      req.session.successMessage = "Internship updated successfully!";
      res.redirect('/recruiter/internships');
    } catch (err) {
      console.error('Error updating internship:', err);
      req.session.errorMessage = "Failed to update internship.";
      res.redirect('/recruiter/internships');
    }
  });

  router.get('/edit-profile', async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.session.errorMessage = 'User not found';
        return res.redirect('/recruiter/home');
      }
  
      res.render('edit-profile', { user });
    } catch (err) {
      console.error('Error loading edit profile page:', err);
      req.session.errorMessage = 'Failed to load profile.';
      res.redirect('/recruiter/home');
    }
  });
  
  
  router.post('/edit-profile', async (req, res) => {
    const { firstName, lastName, phone, gender, newPassword, confirmPassword } = req.body;
  
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.session.errorMessage = 'User not found';
        return res.redirect('/recruiter/edit-profile');
      }
  
      // Check for password update
      if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          req.session.errorMessage = 'Passwords do not match.';
          return res.redirect('/recruiter/edit-profile');
        }
  
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
      }
  
      // Update profile fields
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = phone;
      user.gender = gender;
  
      await user.save();
  
      req.session.successMessage = 'Profile updated successfully!';
      req.session.user = user; 
      res.redirect('/auth/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      req.session.errorMessage = 'Something went wrong while updating profile.';
      res.redirect('/recruiter/edit-profile');
    }
  });

  router.post("/recruiter/upload-verification/:id", upload.single("proofDocument"), async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        // Upload proof document for verification
        if (req.file) {
            const uploadStream = bucket.openUploadStream(req.file.originalname);
            uploadStream.end(req.file.buffer);
            company.proofDocumentId = uploadStream.id;
        }

        await company.save();
        req.session.successMessage = "Proof document uploaded for verification!";
        res.redirect("/recruiter/companies");
    } catch (error) {
        console.error("Error uploading proof document:", error);
        res.status(500).json({ error: "Failed to upload proof document" });
    }
});



router.post("/verify-company/:id", async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        // Check if the company already has a proof document before verifying
        if (!company.proofDocumentId) {
            return res.status(400).json({ error: "No proof document uploaded" });
        }

        // Verify the company by updating the verified status
        company.verified = true;
        await company.save();

        res.redirect("/admin/companies");  // Redirect to admin companies list or show success message
    } catch (error) {
        console.error("Error verifying company:", error);
        res.status(500).json({ error: "Failed to verify company" });
    }
});

router.get("/recruiter/company/:id", async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('proofDocumentId', 'filename')  // Populate proof document info
            .populate('logoId', 'filename');         // Populate logo info

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.render('company-detail', { company });
    } catch (error) {
        console.error("Error fetching company details:", error);
        res.status(500).json({ error: "Failed to fetch company details" });
    }
});

  
  
  

module.exports = router;