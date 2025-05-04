const Job = require('../models/Jobs');

async function deleteExpiredJobs() {
  try {
    const result = await Job.deleteMany({ 
      jobExpiry: { $lt: new Date() } 
    });
    console.log(`Deleted ${result.deletedCount} expired jobs`);
  } catch (error) {
    console.error('Error deleting expired jobs:', error);
  }
}

module.exports = deleteExpiredJobs;