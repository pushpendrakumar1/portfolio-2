const { Pool } = require('pg');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get database connection string from environment variables
    // Try NETLIFY_DATABASE_URL first (Neon), then DATABASE_URL as fallback
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection string not configured',
          details: 'Please set NETLIFY_DATABASE_URL or DATABASE_URL environment variable in Netlify'
        }),
      };
    }

    // Create connection pool
    const pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Query testimonials
    const result = await pool.query(
      'SELECT id, name, position, company, message, rating, created_at FROM testimonials WHERE approved = true ORDER BY created_at DESC LIMIT 10'
    );

    await pool.end();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch testimonials', details: error.message }),
    };
  }
};

