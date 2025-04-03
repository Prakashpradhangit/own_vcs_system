const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.static("public")); // Serves the frontend

// Directory containing JSON files
const JSON_DIR = path.join(__dirname, ".groot");

// Endpoint to get all JSON files dynamically
app.get("/get-json-files", (req, res) => {
    fs.readdir(JSON_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Error reading directory" });
        }

        // Filter JSON files
        const jsonFiles = files.filter(file => file.endsWith(".json"));

        // Read each JSON file and collect data
        let jsonDataArray = [];
        jsonFiles.forEach(file => {
            let fileData = fs.readFileSync(path.join(JSON_DIR, file), "utf8");
            jsonDataArray.push({ filename: file, data: JSON.parse(fileData) });
        });

        res.json(jsonDataArray);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
