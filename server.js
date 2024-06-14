const express = require('express');
const app = express();
const port = 3000;

// Import the database connection
const db = require('./database');

// Middleware to parse JSON
app.use(express.json());

// Import and use the routes from another file
const apiRoutes = require('./apiRoutes.js');
app.use('/api', apiRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});