const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.static("public")); // Serve frontend files

// Absolute path to groot-data.json
const GROOT_DATA_FILE = path.join(__dirname, ".groot-remote", "groot-data.json");

// In-memory cache to hold groot data
let grootCache = null;

// Initial load of groot-data.json
function loadGrootData() {
    fs.readFile(GROOT_DATA_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("❌ Error reading groot-data.json:", err);
            grootCache = null;
            return;
        }

        try {
            grootCache = JSON.parse(data);
            console.log("✅ Groot data loaded successfully.");
        } catch (parseErr) {
            console.error("❌ Invalid JSON format in groot-data.json:", parseErr);
            grootCache = null;
        }
    });
}

// Watch for file changes and reload automatically
fs.watchFile(GROOT_DATA_FILE, (curr, prev) => {
    console.log("🔄 Detected change in groot-data.json, reloading...");
    loadGrootData();
});

// Load once on startup
loadGrootData();

// API endpoint to serve groot data
app.get("/get-groot-data", (req, res) => {
    if (grootCache) {
        return res.json(grootCache);
    } else {
        return res.status(500).json({ error: "Groot data not available" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
