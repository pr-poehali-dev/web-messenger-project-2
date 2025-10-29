import hashlib

# Calculate SHA256 hash of the password (same method as backend/auth/index.py line 18-19)
password = '568876Qqq'
calculated_hash = hashlib.sha256(password.encode()).hexdigest()

# Hash stored in database for user 'skzry'
database_hash = '7c6a180b36896a0a8c02787eeafb0e4c37d5c51b81b0b45c3cc8e2aec82b7c09'

print("=" * 70)
print("PASSWORD HASH COMPARISON FOR USER 'skzry'")
print("=" * 70)
print(f"\nPassword:        '{password}'")
print(f"Calculated hash: {calculated_hash}")
print(f"Database hash:   {database_hash}")
print(f"\nMatch Result:    {calculated_hash == database_hash}")
print("=" * 70)

if calculated_hash != database_hash:
    print("\nISSUE FOUND:")
    print(f"The database hash does NOT match password '{password}'")
    print(f"\nTo fix the login, update the database with:")
    print(f"UPDATE users SET password_hash = '{calculated_hash}' WHERE username = 'skzry';")
else:
    print("\nSUCCESS: The hashes match! Login should work.")