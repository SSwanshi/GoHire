const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Company = require("../models/Companies");
const Job = require("../models/Jobs");
const User = require("../models/User");
const Internship = require("../models/Internship");
const { Application, InternshipApplication } = require("../../applicant-server/models/Application");
const { GridFSBucket, ObjectId } = require("mongodb");
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

const proof_conn = mongoose.connection;

let gfs;
proof_conn.once('open', () => {
    console.log('[GridFS] Connection opened');
  gfs = new GridFSBucket(proof_conn.db, {
    bucketName: 'uploads'// change this if your bucket name is different
  });
});


router.post("/add-company", upload.fields([{ name: "logo" }, { name: "proofDocument" }]), async (req, res) => {
    try {
        const { companyName, website, location } = req.body;

        // Check if required fields are filled
        if (!companyName || !website || !location) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: "All fields are required" });
            }
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

        // Check if request is AJAX
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: "Company added successfully, awaiting verification!" });
        }

        req.session.successMessage = "Company added successfully, awaiting verification!";
        res.redirect("/recruiter/companies");
    } catch (error) {
        console.error("Error adding company:", error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: "Failed to add company" });
        }
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to add company" });
        }
    }
});


router.post("/add-job", upload.none(), async (req, res) => {
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
        console.log("Individual field values:", {
            jobTitle: !!jobTitle,
            jobDescription: !!jobDescription,
            jobRequirements: !!jobRequirements,
            jobSalary: !!jobSalary,
            jobLocation: !!jobLocation,
            jobType: !!jobType,
            jobExperience: !!jobExperience,
            noofPositions: !!noofPositions,
            jobCompany: !!jobCompany,
            jobExpiry: !!jobExpiry
        });

        if (
            !jobTitle || !jobDescription || !jobRequirements || !jobSalary ||
            !jobLocation || !jobType || !jobExperience || !noofPositions || !jobCompany || !jobExpiry
        ) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: "All fields are required" });
            }
            return res.status(400).json({ error: "All fields are required" });
        }

        const companyExists = await Company.findOne({
            _id: jobCompany,
            createdBy: userId,
            verified: true  // ✅ Only allow verified companies
        });

        if (!companyExists) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: "Company must be verified to post a job." });
            }
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
            jobExpiry: new Date(jobExpiry)
        });

        await newJob.save();
        console.log("✅ Job Saved Successfully:", newJob);

        // Check if request is AJAX
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: "Job added successfully!" });
        }

        req.session.successMessage = "Job added successfully!";
        res.redirect("/recruiter/jobs");

    } catch (error) {
        console.error("❌ Error adding job:", error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: "Failed to add job" });
        }
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
        const errorMessage = req.session.errorMessage;
        req.session.successMessage = null;
        req.session.errorMessage = null;

        res.render('companies', { companies, successMessage, errorMessage, user:req.session.user });
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


router.post('/add-internship', upload.none(), async (req, res) => {
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
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }
            return res.status(400).json({ error: 'All fields are required' });
        }

        const companyExists = await Company.findOne({
            _id: intCompany,
            createdBy: req.session.userId,
            verified: true // ✅ Only allow verified companies
        });

        if (!companyExists) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: "Company must be verified to post an internship." });
            }
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
            intExpiry: new Date(intExpiry)
        });

        await newInternship.save();
        console.log("✅ Internship Saved Successfully:", newInternship);

        // Check if request is AJAX
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: "Internship added successfully!" });
        }

        req.session.successMessage = "Internship added successfully!";
        res.redirect('/recruiter/internships');
    } catch (error) {
        console.error("❌ Error adding internship:", error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: 'Failed to add internship' });
        }
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
        const job = await Job.findByIdAndDelete(req.params.jobId);
        if (!job) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(404).json({ success: false, message: 'Job not found' });
            }
            return res.status(404).send('Job not found');
        }

        // Check if request is AJAX
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: 'Job deleted successfully' });
        }
        
        res.redirect('/recruiter/jobs');
    } catch (error) {
        console.error('Error deleting job:', error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: 'Failed to delete job' });
        }
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

router.post('/delete-intern/:intId', async (req, res) => {
    try {
        const internship = await Internship.findByIdAndDelete(req.params.intId);
        if (!internship) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(404).json({ success: false, message: 'Internship not found' });
            }
            return res.status(404).send('Internship not found');
        }

        // Check if request is AJAX
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: 'Internship deleted successfully' });
        }
        
        res.redirect('/recruiter/internships');
    } catch (error) {
        console.error('Error deleting internship:', error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: 'Failed to delete internship' });
        }
        res.status(500).json({ error: 'Failed to delete internship' });
    }
});



router.get("/edit-company/:id", async (req, res) => {
    const company = await Company.findById(req.params.id);
    res.render("add-company", { company, isEdit: true, user: req.session.user });
  });
  

  router.post("/edit-company/:id", upload.fields([{ name: "logo" }, { name: "proofDocument" }]), async (req, res) => {
    try {
        const { companyName, website, location } = req.body;
        
        // Check if required fields are filled
        if (!companyName || !website || !location) {
            req.session.errorMessage = "All fields are required";
            return res.redirect("/recruiter/companies");
        }
        
        const updateData = {
            companyName: companyName.trim(),
            website: website.trim(),
            location: location.trim()
        };

        // Only update logo if a new one is uploaded
        if (req.files && req.files.logo) {
            const uploadStream = bucket.openUploadStream(req.files.logo[0].originalname);
            uploadStream.end(req.files.logo[0].buffer);
            updateData.logoId = uploadStream.id;
        }

        // Only update proof document if a new one is uploaded
        if (req.files && req.files.proofDocument) {
            const uploadStream = bucket.openUploadStream(req.files.proofDocument[0].originalname);
            uploadStream.end(req.files.proofDocument[0].buffer);
            updateData.proofDocumentId = uploadStream.id;
        }

        // Prevent proofDocumentId from being changed
        delete req.body.proofDocumentId;

        await Company.findByIdAndUpdate(req.params.id, updateData);
        req.session.successMessage = "Company updated successfully!";
        res.redirect("/recruiter/companies");
    } catch (error) {
        console.error("Error updating company:", error);
        req.session.errorMessage = "Failed to update company. Please try again.";
        res.redirect("/recruiter/companies");
    }
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
      req.session.user = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        profileImage: user.profileImage
      };
      res.redirect('/recruiter/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      req.session.errorMessage = 'Something went wrong while updating profile.';
      res.redirect('/recruiter/edit-profile');
    }
  });

  router.post('/delete-profile', async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
  
      if (!user) {
        return res.redirect('/auth/login');
      }
  
      await User.findByIdAndDelete(user._id);
  
      // Also clear the session after deletion
      req.session.destroy(err => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.redirect('/auth/login');
      });
  
    } catch (err) {
      console.error('Error deleting profile:', err);
      res.redirect('/auth/login');
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

router.get('/proof/:id', async (req, res) => {
    const fileIdParam = req.params.id;
    console.log(`[Route Hit] GET /proof/${fileIdParam}`);
  
    let fileId;
    try {
      fileId = new ObjectId(fileIdParam);
    } catch (err) {
      console.error('[Error] Invalid ObjectId:', err.message);
      return res.status(400).send('Invalid file ID');
    }
  
    if (!gfs) {
      console.error('[Error] GridFSBucket not initialized');
      return res.status(500).send('File system not ready');
    }
  
    try {
      console.log('[Info] Awaiting file metadata from GridFS...');
      const files = await gfs.find({ _id: fileId }).toArray();
  
      if (!files || files.length === 0) {
        console.warn('[Warning] No file found for ID:', fileId);
        return res.status(404).send('No file found');
      }
  
      const file = files[0];
      console.log('[Success] File metadata found:', {
        filename: file.filename,
        contentType: file.contentType,
        length: file.length
      });
  
      res.set('Content-Type', file.contentType || 'application/pdf');
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);
  
      const downloadStream = gfs.openDownloadStream(file._id);
  
      downloadStream.on('error', (streamErr) => {
        console.error('[Stream Error]', streamErr);
        res.status(500).send('Stream failed');
      });
  
      downloadStream.on('end', () => {
        console.log('[Success] File streamed successfully');
      });
  
      downloadStream.pipe(res);
    } catch (err) {
      console.error('[Fatal Error]', err);
      res.status(500).send('Internal server error');
    }
  });
  
  
  

module.exports = router;