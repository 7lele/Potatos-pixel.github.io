const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");
});

// Routes
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = CryptoJS.SHA256(password).toString();

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Registration failed' });
        }
        res.status(200).json({ message: 'Registration successful' });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = CryptoJS.SHA256(password).toString();

    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, hashedPassword], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Login failed' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        res.status(200).json({ message: 'Login successful', username });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
