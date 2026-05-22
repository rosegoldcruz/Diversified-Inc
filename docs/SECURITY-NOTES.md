# Security Notes

## Database Password Rotation

A raw `DATABASE_URL` containing the database password was exposed during a previous shell command. To mitigate this:

1. **Rotate the Password**:
   - Generate a new password for the `diversified` user in PostgreSQL.
   - Update the password in the database using the following SQL command:
     ```sql
     ALTER USER diversified WITH PASSWORD 'new_secure_password';
     ```

2. **Update Environment Variables**:
   - Update the `.env` and `.env.local` files with the new `DATABASE_URL`.
   - Ensure the updated `.env` files are not committed to version control.

3. **Restart Services**:
   - Restart the application and PM2 processes to apply the new credentials.

4. **Verify Connectivity**:
   - Ensure the application can connect to the database with the new password.

5. **Clean Up**:
   - Remove or avoid persisting shell history that contains the exposed password.

## Best Practices

- Avoid exposing raw credentials in shell commands.
- Use environment variables to manage sensitive information securely.
- Regularly rotate database passwords and other sensitive credentials.
