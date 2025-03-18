const { Application, InternshipApplication } = require('./database');

const seedDatabase = async () => {
  try {
    await Application.bulkCreate([
      { name: 'Sarvjeet Swanshi', email: 'sarvjeetswanshi.com', resume: '/resumes/sarvjeet.pdf', jobTitle: 'Full Stack Developer' },
      { name: 'Saurav Roy', email: 'sauravroy@gmail.com', resume: '/resumes/saurav.pdf', jobTitle: 'Backend Developer' },
      { name: 'Anuj Rathore', email: 'anujrathore@gmail.com', resume: '/resumes/anuj.pdf', jobTitle: 'Front-end Developer' },
    ]);

    await InternshipApplication.bulkCreate([
      { name: 'Sarvjeet Swanshi', email: 'sarvjeetswanshi.com', resume: '/resumes/sarvjeet.pdf', intTitle: 'Front-end Developer' },
      { name: 'Saurav Roy', email: 'sauravroy@gmail.com', resume: '/resumes/saurav.pdf', intTitle: 'Front-end Developer' },
      { name: 'Anuj Rathore', email: 'anujrathore@gmail.com', resume: '/resumes/anuj.pdf', intTitle: 'Front-end Developer' },
    ]);

    console.log('Dummy data added successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;