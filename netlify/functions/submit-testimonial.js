const { Pool } = require('pg');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { name, position, company, message, rating } = JSON.parse(event.body);

    // Validation
    if (!name || !message || !rating) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Name, message, and rating are required' }),
      };
    }

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

    // Insert testimonial (initially not approved)
    const result = await pool.query(
      `INSERT INTO testimonials (name, position, company, message, rating, approved, created_at) 
       VALUES ($1, $2, $3, $4, $5, false, NOW()) 
       RETURNING id, name, position, company, message, rating, created_at`,
      [name, position || null, company || null, message, parseInt(rating) || 5]
    );

    await pool.end();

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Testimonial submitted successfully! It will be reviewed before being published.',
        testimonial: result.rows[0]
      }),
    };
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Failed to submit testimonial', details: error.message }),
    };
  }
};

