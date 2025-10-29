-- Fix admin password hash to match SHA256 of '568876Qqq'
UPDATE users 
SET password_hash = 'd62ca18daa0f343c5c5157bc59e8dad65222e002dd61e5edd50e60ec3a849f86' 
WHERE username = 'skzry';
