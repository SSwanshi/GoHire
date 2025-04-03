const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI_APPLICANTS, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const gfs = Grid(conn.connection.db, mongoose.mongo);
        gfs.collection("uploads");

        console.log("✅ MongoDB Connected with GridFS for File Storage");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed", error);
        process.exit(1);
    }
};

module.exports = connectDB;
