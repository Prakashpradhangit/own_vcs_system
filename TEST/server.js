const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.static("public")); // Serves frontend static files

// Path to the bundled groot-data.json
const GROOT_DATA_FILE = path.join(__dirname, ".groot-remote", "groot-data.json");

// Endpoint to get full groot data
app.get("/get-groot-data", (req, res) => {
    fs.readFile(GROOT_DATA_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading groot-data.json:", err);
            return res.status(500).json({ error: "Failed to read groot-data.json" });
        }

        try {
            const grootData = JSON.parse(data);
            res.json(grootData);
        } catch (parseErr) {
            console.error("Error parsing groot-data.json:", parseErr);
            res.status(500).json({ error: "Invalid JSON format in groot-data.json" });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
