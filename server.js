const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.static("public")); // Serve frontend static files

// Path to the bundled groot-data.json
const GROOT_DATA_FILE = path.join(__dirname, ".groot-remote", "groot-data.json");

// Endpoint to get commit data (this serves the commits part of groot-data.json)
app.get("/commits", (req, res) => {
    fs.readFile(GROOT_DATA_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading groot-data.json:", err);
            return res.status(500).json({ error: "Failed to read groot-data.json" });
        }

        try {
            const grootData = JSON.parse(data);
            const commits = grootData.commits || [];  // Assuming the commits are stored in "commits" property
            res.json(commits);  // Send only the commits data as JSON
        } catch (parseErr) {
            console.error("Error parsing groot-data.json:", parseErr);
            res.status(500).json({ error: "Invalid JSON format in groot-data.json" });
        }
    });
});

// Serve the index.html file for the `/` route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve the dashboard.html file for the `/dashboard` route
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
