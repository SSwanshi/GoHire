
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

let bucket; 

const connectDB = async () => {
    try {
        
        const conn = await mongoose.connect('mongodb+srv://gohire:gohire12345678@gohire.kzwudx0.mongodb.net/goHire_applicants?retryWrites=true&w=majority&appName=GoHire');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        
        const db = mongoose.connection.db;
        bucket = new GridFSBucket(db, {
            bucketName: 'uploads' 
        });

        return { conn, bucket };
    } catch (error) {
        console.error('❌ MongoDB Connection Failed', error);
        process.exit(1);
    }
};

const getBucket = () => {
    if (!bucket) {
        throw new Error('GridFSBucket not initialized. Connect to DB first.');
    }
    return bucket;
};

module.exports = { connectDB, getBucket };