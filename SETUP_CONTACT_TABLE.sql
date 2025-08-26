-- Create Contact Submissions Table for Prop Shop AI
-- Run this in your Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  job_title TEXT,
  company_size TEXT,
  industry TEXT,
  interests TEXT[] NOT NULL,
  message TEXT,
  newsletter_subscription BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'demo_scheduled', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert new submissions
CREATE POLICY "Allow insert for all users" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Only allow admins to view all submissions
CREATE POLICY "Allow select for admins only" ON contact_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_settings 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only allow admins to update submissions
CREATE POLICY "Allow update for admins only" ON contact_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_settings 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Test the table with a sample insert
INSERT INTO contact_submissions (
  first_name, 
  last_name, 
  email, 
  company, 
  interests, 
  message
) VALUES (
  'Test', 
  'User', 
  'test@example.com', 
  'Test Company', 
  ARRAY['demo'], 
  'This is a test submission'
);

-- Verify the table was created
SELECT * FROM contact_submissions;
