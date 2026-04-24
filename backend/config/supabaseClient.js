const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Using Service Key to bypass RLS for backend insertions

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase URL or Key in environment variables.');
}

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'dummy_key');

module.exports = supabase;
