const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files like login.html, dashboard.html

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "prakash", // Your MySQL password
  database: "login_system",
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.stack);
    return;
  }
  console.log("✅ Connected to MySQL");
});

// Create 'users' table if not exists
db.query(
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )`,
  (err) => {
    if (err) {
      console.error("❌ Error creating table:", err);
    } else {
      console.log("✅ Users table ready");
    }
  }
);

// ✅ Signup Route
app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const query =
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
  db.query(query, [username, email, password], (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.json({ message: "Email already registered." });
      }
      console.error("Signup error:", err);
      return res.status(500).json({ message: "Server error." });
    }
    res.json({ message: "Signup successful!" });
  });
});

// ✅ Login Route (MySQL-based)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error." });
    }

    if (results.length > 0) {
      const user = results[0];
      res.json({
        message: "Login successful!",
        user: {
          username: user.username,
          email: user.email,
        },
        redirect: "/dashboard.html",
      });
    } else {
      res.json({ message: "Invalid email or password" });
    }
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
