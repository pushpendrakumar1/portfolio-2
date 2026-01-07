const { neon } = require('@netlify/neon');

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
    // Initialize Neon client - automatically uses NETLIFY_DATABASE_URL
    const sql = neon();

    // Query testimonials using template literal syntax
    const result = await sql`
      SELECT id, name, position, company, message, rating, created_at 
      FROM testimonials 
      WHERE approved = true 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
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

