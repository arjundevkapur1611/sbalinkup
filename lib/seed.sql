-- Insert sample users (passwords are hashed version of "password")
INSERT INTO users (id, email, password_hash, name, role, bio, location, education, experience, interests, skills, linkedin, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'arjundevkapur@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJVfJpjvK', 'Arjun Kapur', 'admin', 'Platform Administrator and System Manager', 'New York, NY', 'Computer Science', 'Platform Development and Management', ARRAY['Technology', 'Sports Business', 'Platform Management'], ARRAY['System Administration', 'Platform Management', 'User Experience'], 'arjundevkapur', '2024-01-01 00:00:00'),

('550e8400-e29b-41d4-a716-446655440001', 'sarah@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJVfJpjvK', 'Sarah Johnson', 'student', 'Sports management student passionate about analytics and team operations.', 'Boston, MA', 'Boston University - Sport Management', '', ARRAY['Analytics', 'Team Operations', 'Marketing'], ARRAY['Data Analysis', 'Excel', 'Communication'], 'sarah-johnson', '2024-01-15 00:00:00'),

('550e8400-e29b-41d4-a716-446655440002', 'mike@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJVfJpjvK', 'Mike Chen', 'professional', 'Sports marketing professional with 8 years of experience in digital campaigns.', 'Los Angeles, CA', 'UCLA - Marketing', '8 years in sports marketing', ARRAY['Digital Marketing', 'Brand Strategy', 'Social Media'], ARRAY['Marketing Strategy', 'Social Media', 'Campaign Management'], 'mike-chen', '2024-01-10 00:00:00'),

('550e8400-e29b-41d4-a716-446655440003', 'jessica@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJVfJpjvK', 'Jessica Williams', 'student', 'Business student interested in sports finance and operations.', 'Chicago, IL', 'Northwestern University - Business', 'Internship at Chicago Bulls', ARRAY['Finance', 'Operations', 'Analytics'], ARRAY['Financial Analysis', 'Excel', 'Project Management'], 'jessica-williams', '2024-01-12 00:00:00'),

('550e8400-e29b-41d4-a716-446655440004', 'david@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJVfJpjvK', 'David Rodriguez', 'professional', 'Former athlete turned sports agent with focus on contract negotiations.', 'Miami, FL', 'University of Miami - Sports Management', '10 years as sports agent', ARRAY['Contract Negotiation', 'Player Development', 'Legal'], ARRAY['Negotiation', 'Legal Knowledge', 'Relationship Building'], 'david-rodriguez', '2024-01-08 00:00:00');

-- Insert sample job postings
INSERT INTO job_postings (id, posted_by, title, company, location, type, description, required_skills, preferred_skills, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Sports Marketing Intern', 'Nike', 'Portland, OR', 'internship', 'Join our sports marketing team to help develop campaigns for our athlete partnerships. You''ll work on social media content, event planning, and brand activations.', ARRAY['Marketing', 'Social Media', 'Communication'], ARRAY['Adobe Creative Suite', 'Sports Knowledge', 'Event Planning'], '2024-01-20 00:00:00'),

('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Data Analyst', 'ESPN', 'Bristol, CT', 'full-time', 'Analyze sports data to provide insights for our broadcasting team. Create visualizations and reports that help tell compelling sports stories.', ARRAY['Data Analysis', 'SQL', 'Statistics'], ARRAY['Python', 'R', 'Tableau', 'Sports Knowledge'], '2024-01-18 00:00:00'),

('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'Sports Finance Analyst', 'Miami Heat', 'Miami, FL', 'full-time', 'Support the finance team with salary cap management, contract analysis, and financial planning for the organization.', ARRAY['Finance', 'Excel', 'Analysis'], ARRAY['CPA', 'Sports Business Knowledge', 'SQL'], '2024-01-16 00:00:00'),

('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Community Outreach Volunteer', 'Los Angeles Lakers Foundation', 'Los Angeles, CA', 'volunteer', 'Help organize and execute community events that bring basketball and education together for underserved youth.', ARRAY['Communication', 'Event Planning', 'Community Service'], ARRAY['Spanish', 'Youth Development', 'Sports Background'], '2024-01-14 00:00:00');

-- Insert sample job applications
INSERT INTO job_applications (job_id, user_id, status, applied_at) VALUES
('650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'pending', '2024-01-21 00:00:00'),
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'pending', '2024-01-19 00:00:00'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'pending', '2024-01-15 00:00:00'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'pending', '2024-01-15 00:00:00');

-- Insert sample conversations
INSERT INTO conversations (id, participant1_id, participant2_id, last_activity, created_at) VALUES
('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '2024-01-21 11:15:00', '2024-01-21 10:30:00'),
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '2024-01-20 14:20:00', '2024-01-20 14:20:00');

-- Insert sample messages
INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at) VALUES
('850e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Hi Sarah! I saw your application for the Nike internship. Would love to chat about it!', false, '2024-01-21 10:30:00'),
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Hi Mike! Thank you for reaching out. I''m very excited about this opportunity!', true, '2024-01-21 11:15:00'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Jessica, your background in finance looks great for our analyst position. Let''s schedule a call!', false, '2024-01-20 14:20:00');

-- Update conversations with last message references
UPDATE conversations SET last_message_id = '850e8400-e29b-41d4-a716-446655440001' WHERE id = '750e8400-e29b-41d4-a716-446655440000';
UPDATE conversations SET last_message_id = '850e8400-e29b-41d4-a716-446655440002' WHERE id = '750e8400-e29b-41d4-a716-446655440001';

-- Insert sample interviews
INSERT INTO interviews (id, student_id, professional_id, job_id, scheduled_date, duration, status, type, meeting_link, notes, created_at) VALUES
('950e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440000', '2024-01-25 14:00:00', 30, 'scheduled', 'video', 'https://zoom.us/j/123456789', 'Initial screening for Nike internship position', '2024-01-22 00:00:00'),
('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', '2024-01-23 10:00:00', 45, 'scheduled', 'video', 'https://teams.microsoft.com/l/meetup-join/123', 'Technical interview for ESPN Data Analyst role', '2024-01-21 00:00:00'),
('950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', null, '2024-01-20 16:00:00', 30, 'completed', 'phone', null, 'Career guidance session', '2024-01-19 00:00:00');

-- Update completed interview with feedback
UPDATE interviews SET feedback = 'Great potential, needs to work on technical skills', rating = 4 WHERE id = '950e8400-e29b-41d4-a716-446655440002';

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'message', 'New Message', 'You have a new message from Mike Chen', '2024-01-21 10:30:00'),
('550e8400-e29b-41d4-a716-446655440001', 'interview_scheduled', 'Interview Scheduled', 'Your interview for Nike Sports Marketing Intern has been scheduled for January 25th', '2024-01-22 00:00:00'),
('550e8400-e29b-41d4-a716-446655440003', 'message', 'New Message', 'You have a new message from David Rodriguez', '2024-01-20 14:20:00'),
('550e8400-e29b-41d4-a716-446655440002', 'job_application', 'New Application', 'Sarah Johnson applied for your Nike Sports Marketing Intern position', '2024-01-21 00:00:00');