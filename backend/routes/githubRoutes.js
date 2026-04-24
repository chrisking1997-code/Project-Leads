const express = require('express');
const router = express.Router();
const { fetchDevelopersFromGitHub } = require('../controllers/githubController');

// Route to fetch and save leads from GitHub
router.get('/fetch-leads', fetchDevelopersFromGitHub);

module.exports = router;
