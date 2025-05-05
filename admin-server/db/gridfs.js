const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// Replace with your MongoDB URI if not using default
const mongoURI = 'mongodb://localhost:27017/adminDB'; // Change 'adminDB' if your DB name differs

const conn = mongoose.createConnection(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

let gfs;
let bucket;

conn.once('open', () => {
    console.log('✅ Admin GridFS connected');

    bucket = new GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });

    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });
});

module.exports = { gfs, bucket };
