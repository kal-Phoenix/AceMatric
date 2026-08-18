-- Add role column to student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

-- Set initial admin based on ADMIN_EMAILS env var (run this manually with your admin email)
-- UPDATE student_profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
