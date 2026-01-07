-- Neon PostgreSQL Database Schema for Testimonials
-- Run this SQL in your Neon database console

CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    company VARCHAR(100),
    message TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved, created_at);

-- Insert some sample testimonials (optional)
INSERT INTO testimonials (name, position, company, message, rating, approved) VALUES
('John Doe', 'Project Manager', 'Tech Corp', 'Pushpendra delivered an exceptional portfolio website that exceeded our expectations. His attention to detail and technical expertise are remarkable.', 5, true),
('Integer Telecom', 'Automation Developer', 'Integer Telecom Services', 'Working with Pushpendra was a great experience. He created a robust automation tool that significantly improved our workflow efficiency.', 5, true),
('School Admin', 'Administrator', 'Education Sector', 'The school website developed by Pushpendra is user-friendly, responsive, and beautifully designed. Highly recommended for web development projects.', 5, true)
ON CONFLICT DO NOTHING;

