const express = require('express');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const multer = require('multer');

const authRoutes = require('./routes/auth');
const appUsers = require('./routes/auth');
const applicantRoutes = require('./routes/applicant');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payment');
const { connectDB, getGfs } = require('./config/db');

const MongoStore = require('connect-mongo');

require("dotenv").config();
const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  },
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://gohire:gohire12345678@gohire.kzwudx0.mongodb.net/goHire_applicants?retryWrites=true&w=majority',
    ttl: 14 * 24 * 60 * 60
  })
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(passport.initialize());
app.use(passport.session());
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use('/profile', profileRoutes);

// API route for profile data (for dynamic profile.html)
const User = require('./models/user');
const AppliedJob = require('./models/Applied_for_Jobs');
const AppliedInternship = require('./models/Applied_for_Internships');
const { getBucket } = require('./config/db');
const { ObjectId } = require('mongodb');
const connectRecruiterDB = require('./config/recruiterDB');
const createJobModel = require('./models/recruiter/Job');
const createInternshipModel = require('./models/recruiter/Internships');
const createCompanyModel = require('./models/recruiter/Company');

app.get('/api/profile', async (req, res) => {
    try {
        if (!req.session.user?.authenticated) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findOne({ userId: req.session.user.id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let resumeName = null;
        if (user.resumeId) {
            const bucket = getBucket();
            const files = await bucket.find({ _id: new ObjectId(user.resumeId) }).toArray();
            if (files.length > 0) resumeName = files[0].filename;
        }

        const jobApplications = await AppliedJob.find({ userId: req.session.user.id });
        const internshipApplications = await AppliedInternship.find({ userId: req.session.user.id });

        const jobIds = [...new Set(jobApplications.map(app => app.jobId).filter(Boolean))];
        const internshipIds = [...new Set(internshipApplications.map(app => app.internshipId).filter(Boolean))];

        const recruiterConn = await connectRecruiterDB();
        const JobFindConn = createJobModel(recruiterConn);
        const InternshipFindConn = createInternshipModel(recruiterConn);
        const CompanyFindConn = createCompanyModel(recruiterConn);

        // Fetch jobs and internships WITHOUT populate first
        const [jobs, internships] = await Promise.all([
            jobIds.length > 0 ? JobFindConn.find({ _id: { $in: jobIds } }) : [],
            internshipIds.length > 0 ? InternshipFindConn.find({ _id: { $in: internshipIds } }) : []
        ]);

        // Manually fetch company data for jobs
        const jobCompanyIds = [...new Set(jobs.map(job => job.jobCompany).filter(Boolean))];
        const companies = jobCompanyIds.length > 0 
            ? await CompanyFindConn.find({ _id: { $in: jobCompanyIds } })
            : [];
        
        const companyMap = companies.reduce((map, company) => {
            map[company._id.toString()] = company;
            return map;
        }, {});

        // Manually fetch company data for internships
        const internshipCompanyIds = [...new Set(internships.map(int => int.intCompany).filter(Boolean))];
        const internshipCompanies = internshipCompanyIds.length > 0
            ? await CompanyFindConn.find({ _id: { $in: internshipCompanyIds } })
            : [];
        
        const internshipCompanyMap = internshipCompanies.reduce((map, company) => {
            map[company._id.toString()] = company;
            return map;
        }, {});

        const jobMap = jobs.reduce((map, job) => {
            map[job._id] = job;
            return map;
        }, {});
        
        const internshipMap = internships.reduce((map, internship) => {
            map[internship._id] = internship;
            return map;
        }, {});

        const applicationHistory = [
            ...jobApplications.map(app => {
                const job = app.jobId ? jobMap[app.jobId] : null;
                const company = job?.jobCompany ? companyMap[job.jobCompany.toString()] : null;
                return {
                    type: 'Job',
                    title: job?.jobTitle || 'Job No Longer Available',
                    company: company?.companyName || 'Company No Longer Available',
                    appliedAt: app.AppliedAt,
                    status: app.isSelected ? 'Accepted' : app.isRejected ? 'Rejected' : 'Pending',
                    applicationId: app._id
                };
            }),
            ...internshipApplications.map(app => {
                const internship = app.internshipId ? internshipMap[app.internshipId] : null;
                const company = internship?.intCompany ? internshipCompanyMap[internship.intCompany.toString()] : null;
                return {
                    type: 'Internship',
                    title: internship?.intTitle || 'Internship No Longer Available',
                    company: company?.companyName || 'Company No Longer Available',
                    appliedAt: app.AppliedAt,
                    status: app.isSelected ? 'Accepted' : app.isRejected ? 'Rejected' : 'Pending',
                    applicationId: app._id
                };
            })
        ];

        applicationHistory.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        res.json({
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                gender: user.gender,
                profileImageId: user.profileImageId
            },
            resumeName,
            applicationHistory
        });

    } catch (error) {
        console.error('Profile API error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/', (req, res) => {
  res.render('home', {
    user: req.session.user
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/profiles/';
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});
app.use('/auth', authRoutes);
app.use('/', applicantRoutes);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/signup.html'));
});

app.get('/', (req, res) => {
  res.redirect('/payment');
});
app.use('/', paymentRoutes);

connectDB();

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));