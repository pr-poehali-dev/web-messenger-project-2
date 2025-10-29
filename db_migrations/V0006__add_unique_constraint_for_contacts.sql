-- Add unique constraint for contacts to prevent duplicates
ALTER TABLE t_p69961614_web_messenger_projec.contacts 
ADD CONSTRAINT unique_user_contact UNIQUE (user_id, contact_user_id);
