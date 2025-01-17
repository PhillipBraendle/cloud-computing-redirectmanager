// Importing required modules
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// File to store entries
const DATA_FILE = './slugs.json';

// Load or initialize entries
let entries = {};
if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE);
    entries = JSON.parse(data);
}

// Save entries to file
const saveEntries = () => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
};

// Authentication middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const validToken = process.env.BEARER_TOKEN || 'default_token';

    if (!token || token !== validToken) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
};

// GET /:slug - Redirect to the target URL
app.get('/:slug', (req, res) => {
    const slug = req.params.slug;
    if (entries[slug]) {
        return res.redirect(entries[slug]);
    }
    res.status(404).json({ error: 'Slug not found' });
});

// GET /entries - List all entries (requires authentication)
app.get('/entries', authenticate, (req, res) => {
    res.json(entries);
});

// DELETE /entry/:slug - Remove an entry by slug
app.delete('/entry/:slug', authenticate, (req, res) => {
    const slug = req.params.slug;
    if (entries[slug]) {
        delete entries[slug];
        saveEntries();
        return res.json({ message: 'Entry deleted successfully' });
    }
    res.status(404).json({ error: 'Slug not found' });
});

// POST /entry - Add a new entry
app.post('/entry', authenticate, (req, res) => {
    const { slug, url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const newSlug = slug || generateSlug();

    if (entries[newSlug]) {
        return res.status(409).json({ error: 'Slug already exists' });
    }

    entries[newSlug] = url;
    saveEntries();
    res.status(201).json({ slug: newSlug, url });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
