const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();

router.post("/company-logo", upload.single("file"), (req, res) => {
    res.json({ fileId: req.file.id, message: "Company logo uploaded successfully!" });
});

router.post("/profile", upload.single("file"), (req, res) => {
    res.json({ fileId: req.file.id, message: "Profile image uploaded successfully!" });
});

module.exports = router;
