const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
require('dotenv').config();

let gfs; // This will hold our GridFS stream

const connectDB = async () => {
    try {
        // Connect to MongoDB (without deprecated options)
        const conn = await mongoose.connect('mongodb+srv://gohire:gohire12345678@gohire.kzwudx0.mongodb.net/goHire_applicants?retryWrites=true&w=majority&appName=GoHire');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Initialize GridFS only after successful connection
        const db = mongoose.connection.db;
        gfs = Grid(db, mongoose.mongo);
        gfs.collection('uploads'); // 'uploads' is your collection name

        return { conn, gfs };
    } catch (error) {
        console.error('❌ MongoDB Connection Failed', error);
        process.exit(1);
    }
};

// Create a function to get the initialized gfs
const getGfs = () => {
    if (!gfs) {
        throw new Error('GridFS not initialized. Connect to DB first.');
    }
    return gfs;
};

module.exports = { connectDB, getGfs };