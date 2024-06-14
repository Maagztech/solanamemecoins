const express = require('express');
const router = express.Router();
const { insertDataToDB } = require('./database');
const { scrapeData } = require('./onetime'); 
const { realTimeData } = require('./realtimescrap');
// Define an API endpoint
router.get('/creatememetable', async (req, res) => {
    try {
        const data = await scrapeData();
        const rowCount = await insertDataToDB(data);
        res.status(200).json({ rowCount });
    } catch (error) {
        console.error('Error performing scraping and insertion:', error);
        res.status(500).send('An error occurred while performing scraping and insertion.');
    }
});

router.get('/coindeatils', (req, res) => {
    realTimeData(req, res);
});

module.exports = router;