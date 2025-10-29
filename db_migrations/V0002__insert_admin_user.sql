-- Insert admin user with pre-hashed password (sha256 of '568876Qqq')
INSERT INTO users (username, password_hash, display_name, is_admin, is_verified)
VALUES ('skzry', '7c6a180b36896a0a8c02787eeafb0e4c37d5c51b81b0b45c3cc8e2aec82b7c09', 'Администратор', TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;
