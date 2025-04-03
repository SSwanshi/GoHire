const express = require("express");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

const router = express.Router();
const conn = mongoose.connection;
Grid.mongo = mongoose.mongo;
let gfs;

conn.once("open", () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
});

router.get("/:id", async (req, res) => {
    try {
        const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!file) return res.status(404).json({ message: "File not found" });

        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving file", error: err });
    }
});

module.exports = router;
