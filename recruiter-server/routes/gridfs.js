const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'profileImages'
  });
});

module.exports = gfs;