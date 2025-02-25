const bcrypt = require('bcrypt');
const Recruiter = require('../models/recruiter');

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newRecruiter = new Recruiter({ name, email, password: hashedPassword });
    await newRecruiter.save();
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating recruiter');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const recruiter = await Recruiter.findOne({ email });
    if (recruiter && (await bcrypt.compare(password, recruiter.password))) {
      res.redirect('/recruiter/add-company');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
};
