const { neon } = require('@netlify/neon');

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

    // Initialize Neon client - automatically uses NETLIFY_DATABASE_URL
    const sql = neon();

    // Insert testimonial (initially not approved) using template literal syntax
    const result = await sql`
      INSERT INTO testimonials (name, position, company, message, rating, approved, created_at) 
      VALUES (${name}, ${position || null}, ${company || null}, ${message}, ${parseInt(rating) || 5}, false, NOW()) 
      RETURNING id, name, position, company, message, rating, created_at
    `;

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Testimonial submitted successfully! It will be reviewed before being published.',
        testimonial: result[0]
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

