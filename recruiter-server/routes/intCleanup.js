const Intern = require('../models/Internship');

async function deleteExpiredInternship() {
  try {
    const result = await Intern.deleteMany({ 
        intExpiry: { $lt: new Date() } 
    });
    console.log(`Deleted ${result.deletedCount} expired internship`);
  } catch (error) {
    console.error('Error deleting expired internships:', error);
  }
}

module.exports = deleteExpiredInternship;