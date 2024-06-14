const express = require('express');
const router = express.Router();

// Import the function to be called when the API is hit
const { performFunction } = require('./onetime'); // Adjust the path as necessary
const { realTimeData } = require('./realtimescrap');
// Define an API endpoint
router.get('/creatememetable', (req, res) => {
    performFunction(req, res);
});

router.get('/coindeatils', (req, res) => {
    realTimeData(req, res);
});

module.exports = router;