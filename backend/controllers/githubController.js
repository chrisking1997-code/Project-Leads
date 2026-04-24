const axios = require('axios');
const supabase = require('../config/supabaseClient');

// Helper to fetch developers from GitHub based on a query (e.g., location, language)
const fetchDevelopersFromGitHub = async (req, res) => {
  const { keyword, location, language } = req.query;

  // Construct search query
  let queryParts = [];
  if (keyword) queryParts.push(keyword);
  if (location) queryParts.push(`location:${location}`);
  if (language) queryParts.push(`language:${language}`);

  const q = queryParts.join(' ');

  if (!q) {
    return res.status(400).json({ error: 'Please provide at least one search parameter (keyword, location, or language)' });
  }

  try {
    // 1. Fetch users from GitHub Search API
    const searchResponse = await axios.get(`https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=10`, {
      headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const users = searchResponse.data.items;

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No developers found.' });
    }

    const leads = [];

    // 2. Fetch detailed info for each user to get their email/company/name
    for (const user of users) {
      try {
        const userDetailsResponse = await axios.get(user.url, {
          headers: {
            Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
            Accept: 'application/vnd.github.v3+json'
          }
        });

        const details = userDetailsResponse.data;

        // We only want leads with useful info, maybe? Let's just grab what we can.
        leads.push({
          source: 'github',
          source_id: user.id.toString(),
          name: details.name || user.login,
          username: user.login,
          email: details.email || null, // Note: many users keep email private
          company: details.company || null,
          location: details.location || null,
          profile_url: user.html_url,
          bio: details.bio || null,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Failed to fetch details for user ${user.login}:`, err.message);
      }
    }

    // 3. Insert leads into Supabase
    // We use upsert on source_id to avoid duplicates if we run the search again
    if (leads.length > 0) {
      const { data, error } = await supabase
        .from('leads')
        .upsert(leads, { onConflict: 'source_id' })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to save leads to database.' });
      }

      return res.status(200).json({
        message: `Successfully fetched and saved ${data.length} leads.`,
        data: data
      });
    } else {
      return res.status(200).json({ message: 'No detailed lead information could be retrieved.' });
    }

  } catch (error) {
    console.error('GitHub API error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch developers from GitHub.' });
  }
};

module.exports = {
  fetchDevelopersFromGitHub
};
