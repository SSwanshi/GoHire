const express = require("express");
const path = require("path");
const Job = require("../recruiter-server/models/Jobs");
const Internship = require("../recruiter-server/models/Internship");
const User = require("../recruiter-server/models/User")
const { applications } = require("../recruiter-server/routes/recruiter");
const { users } = require("../recruiter-server/routes/auth");
const connectDB = require("./config/db");
const createJobModel = require("../admin-server/models/Job");
const createInternshipModel = require("../admin-server/models/Internship");
const createCompanyModel = require("../admin-server/models/Company");
const connectRecruiterDB = require("../admin-server/config/recruiterDB");
const connectApplicantDB = require("../admin-server/config/applicantDB");
const createRecruiterModel = require("../admin-server/models/Recruiter");
const adminRoutes = require('./routes/admin');


const mongoose = require("mongoose");
// const Applicant = require('../admin-server/models/applicant'); // Adjust path as needed

require("dotenv").config();
const app = express();
const PORT = 9000;
const session = require("express-session");
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', adminRoutes);

const validUsers = [
  { email: "sarvjeet.s23@iiits.in", password: "1234", isPremium: true },
  { email: "sauravkumar.r23@iiits.in", password: "1234", isPremium: false },
  { email: "kartik.r23@iiits.in", password: "1234", isPremium: true },
  { email: "anuj.r23@iiits.in", password: "1234", isPremium: true },
  { email: "likhita.b23@iiits.in", password: "1234", isPremium: true },
];

app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = validUsers.find((user) => user.email === email);

  if (user) {
    if (user.password === password) {
      req.session.user = user;
      return res.redirect("/home");
    } else {
      return res.send("Incorrect password");
    }
  } else {
    return res.send("Incorrect email");
  }
});

app.get("/home", (req, res) => {
  res.render("home");
});

function createUserModel(connection) {
  const applicantSchema = new mongoose.Schema({
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    companyName: {
      type: String,
      required: true
    },
    // You might want to keep resume data even if not displaying it
    resumeId: {
      type: mongoose.Schema.Types.ObjectId
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  });

  return connection.model("User", applicantSchema);
}

app.get("/applicantlist", async (req, res) => {
  try {
    // Connect to applicant database
    const applicantConn = await connectApplicantDB();

    // Get User model (assuming your applicants are stored in User collection)
    const UserModel = createUserModel(applicantConn);

    // Fetch applicants (you might want to add filters if needed)
    const applicants = await UserModel.find({}); // Filter by role if exists

    // console.log("Fetched applicants:", applicants); // Debug log

    res.render("applicantlist", { applicants });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).send("Internal Server Error");
  }
});

// function createRecruiterModel(connection) {
//   // if (connection.models.Recruiter) {
//   //   return connection.model("RecruiterUser");
//   // }
//   const recruiterSchema = new mongoose.Schema({
//     firstName: {
//       type: String,
//       required: true
//     },
//     lastName: {
//       type: String,
//       required: true
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true
//     }
//   }, { timestamps: true });

//   return connection.model("RecruiterUser", recruiterSchema);
// }


app.get("/recruiterlist", async (req, res) => {
  try {
    const recruiterConn = await connectRecruiterDB(); // Ensure this is awaited
    const RecruiterModel = recruiterConn.model('RecruiterUser');
    const recruiters = await RecruiterModel.find({});

    res.render("recruiterlist", {recruiters});
  } catch (error) {
    console.error("Error fetching recruiters:", error);
    res.status(500).send("Internal Server Error");
  }
});

// app.get("/recruiterlist", async (req, res) => {
//   try {
//     const recruiterConn = await connectRecruiterDB();
//     const Recruiter = recruiterConn.model('Recruiter');
    
//     const recruiters = await Recruiter.find({})
//       .select('firstName lastName email company')
//       .lean();

//     res.render("recruiterlist", {
//       recruiters: recruiters.map(r => ({
//         fullName: ${r.firstName} ${r.lastName},
//         email: r.email,
//         company: r.company
//       }))
//     });
//   } catch (error) {
//     console.error("Error fetching recruiters:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });


app.get("/companylist", async (req, res) => {
  try {
    const recruiterConn = await connectRecruiterDB();
    const CompanyModel = createCompanyModel(recruiterConn);
    const companies = await CompanyModel.find({});
    res.render("companylist", { companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).send("Internal Server Error");
  }
});

// company, job, applicant and recuiter delete route
app.delete('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const recruiterConn = await connectRecruiterDB();
    const applicantConn = await connectApplicantDB();

    let Model;
    if (type === 'company') {
      Model = createCompanyModel(recruiterConn);
    } else if (type === 'job') {
      Model = createJobModel(recruiterConn);
    } else if (type === 'applicant'){
      Model = createUserModel(applicantConn);
    } else if (type === 'recruiter'){
      Model = recruiterConn.model('RecruiterUser')
    }
    else {
      return res.status(400).json({ message: 'Invalid type. Use "company" or "job" or "applicant".' });
    }

    const deletedDoc = await Model.findByIdAndDelete(id);
    if (!deletedDoc) {
      return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found.` });
    }

    res.json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.` });
  } catch (err) {
    console.error(`Error deleting ${req.params.type}:`, err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// internship list
app.get("/internshiplist", async (req, res) => {
  try {
    const recruiterConn = await connectRecruiterDB();

    // Important: Create models in the correct order
    const CompanyModel = createCompanyModel(recruiterConn); // Must be created first
    const InternshipFindConn = createInternshipModel(recruiterConn);

    const internships = await InternshipFindConn.find({})
      .populate({
        path: "intCompany",
        model: "Company", // Must exactly match the registered model name
        strictPopulate: false,
      })
      .lean();

    // Rest of your grouping logic...
    const companyMap = {};

    internships.forEach((intern) => {
      const company = intern.intCompany;
      if (!company) return;

      const companyName = company.companyName;
      if (!companyName) return;

      if (!companyMap[companyName]) {
        companyMap[companyName] = {
          ...company,
          internships: [],
        };
      }
      companyMap[companyName].internships.push(intern);
    });

    res.render("internshiplist", {
      companies: Object.values(companyMap),
      filters: {},
    });
  } catch (err) {
    console.error("Error fetching internships:", err);
    res.status(500).send("Internal Server Error");
  }
});

// joblist
app.get("/joblist", async (req, res) => {
  try {
    const recruiterConn = await connectRecruiterDB();
    const JobModel = createJobModel(recruiterConn);
    const CompanyModel = createCompanyModel(recruiterConn);

    // Get all companies with their jobs populated in a single query
    const companies = await CompanyModel.find({}).lean();
    const jobs = await JobModel.find({}).populate("jobCompany").lean();

    // Group by company name instead of ID
    const companyMap = {};

    jobs.forEach((job) => {
      const companyName = job.jobCompany?.companyName;
      if (!companyName) return;

      if (!companyMap[companyName]) {
        companyMap[companyName] = {
          ...job.jobCompany,
          jobs: [],
        };
      }
      companyMap[companyName].jobs.push(job);
    });

    res.render("joblist", {
      companies: Object.values(companyMap),
      filters: {},
    });
  } catch (err) {
    console.error("Error fetching jobs from recruiter DB:", err);
    res.status(500).send("Internal Server Error");
  }
});



app.get("/logo/:logoId", async (req, res) => {
  try {
    const logoId = req.params.logoId;

    // Fetch the logo from recruiter server
    const response = await axios({
      method: "get",
      url: `http://localhost:5000/recruiter/logo/${logoId}`,
      responseType: "stream",
    });

    // Set the same content type
    res.setHeader("Content-Type", response.headers["content-type"]);

    // Pipe the data (image) to the response
    response.data.pipe(res);
  } catch (error) {
    console.error("Error proxying logo:", error.message);
    res.status(500).json({ error: "Failed to fetch logo" });
  }
});

const isPremiumUser = (req, res, next) => {
  next();
};

app.get("/premiumuser", isPremiumUser, (req, res) => {
  const premiumUsers = validUsers
    .filter((user) => user.isPremium)
    .sort((a, b) => a.email.localeCompare(b.email));

  res.render("premiumuser", {
    user: req.session.user,
    premiumUsers: premiumUsers,
  });
});

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
