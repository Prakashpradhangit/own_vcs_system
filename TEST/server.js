const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.static("public")); // Serves the frontend

// ✅ Corrected JSON directory path
const JSON_DIR = path.join("C:/Users/prakash/Desktop/MAJOR PROJECT/PROJECT/.groot");

app.get("/get-json-files", (req, res) => {
    fs.readdir(JSON_DIR, (err, files) => {
        if (err) {
            console.error("❌ Error reading directory:", err);
            return res.status(500).json({ error: "Error reading directory" });
        }

        const jsonFiles = files.filter(file => file.endsWith(".json"));

        let jsonDataArray = [];

        jsonFiles.forEach(file => {
            try {
                let fileData = fs.readFileSync(path.join(JSON_DIR, file), "utf8");
                jsonDataArray.push({ filename: file, data: JSON.parse(fileData) });
            } catch (err) {
                console.error(`❌ Error parsing ${file}:`, err);
            }
        });

        res.json(jsonDataArray);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 JSON Server running at http://localhost:${PORT}`);
});
