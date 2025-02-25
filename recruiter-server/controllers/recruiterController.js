const Company = require('../models/company'); 
const Job = require('../models/job');

exports.addCompany = async (req, res) => {
  const { name, description } = req.body;

  try {
    const newCompany = new Company({ name, description, recruiter: req.user.id });
    await newCompany.save();
    res.redirect('/recruiter/add-job');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding company');
  }
};

exports.addJob = async (req, res) => {
  const { title, description, company, location, salary } = req.body;

  try {
    const newJob = new Job({ title, description, company, location, salary });
    await newJob.save();
    res.redirect('/recruiter/add-job');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding job');
  }
};
