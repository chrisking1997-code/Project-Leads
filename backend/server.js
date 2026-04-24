require('dotenv').config();
const express = require('express');
const cors = require('cors');

const githubRoutes = require('./routes/githubRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Routes
app.use('/api/github', githubRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Leads Generator API is running.' });
});

// Server setup
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
