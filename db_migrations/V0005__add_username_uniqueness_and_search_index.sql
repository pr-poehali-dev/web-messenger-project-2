-- Add unique username constraint for user search functionality
ALTER TABLE t_p69961614_web_messenger_projec.users 
ADD CONSTRAINT unique_username UNIQUE (username);

-- Add index for faster username lookups
CREATE INDEX idx_users_username ON t_p69961614_web_messenger_projec.users(username);
