const express = require("express");
const path = require("path");
const Job = require("../recruiter-server/models/Jobs");
const Internship = require("../recruiter-server/models/Internship");
const { applications } = require("../recruiter-server/routes/recruiter");
const { users } = require("../recruiter-server/routes/auth");
const connectDB = require("./config/db");
const createJobModel = require("../admin-server/models/Job");
const createInternshipModel = require("../admin-server/models/Internship");
const createCompanyModel = require("../admin-server/models/Company");
const connectRecruiterDB = require("../admin-server/config/recruiterDB");

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get("/applicantlist", (req, res) => {
  res.render("applicantlist", { applications: applications });
});

app.get("/companylist", async (req, res) => {
    try {
      const recruiterConn = await connectRecruiterDB();
      const CompanyModel = createCompanyModel(recruiterConn);
      const companies = await CompanyModel.find({});  // Fixed: using CompanyModel instead of createCompanyModel
      res.render("companylist", { companies });
    } catch (error) {
      console.error("Error fetching companies:", error);  // Fixed: using error instead of err
      res.status(500).send("Internal Server Error");
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

app.get("/recruiterlist", (req, res) => {
  res.render("recruiterlist", { users: users });
});

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
