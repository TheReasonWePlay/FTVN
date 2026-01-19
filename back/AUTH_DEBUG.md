# 🔐 Authentication Debugging Guide

## Common Authentication Issues & Solutions

### 1. **"Utilisateur introuvable" (User not found)**

**Symptoms:** Login fails with "Utilisateur introuvable" error

**Possible Causes & Solutions:**

- **User doesn't exist in database:**
  ```sql
  SELECT * FROM utilisateur WHERE nomUser = 'your_username';
  SELECT * FROM personne WHERE email = 'your_email@example.com';
  ```
- **Email login but user only has nomUser:** Ensure the email exists in the `personne` table and is linked to the user
- **Case sensitivity:** Check if the username/email matches exactly (including case)

### 2. **"Mot de passe incorrect" (Incorrect password)**

**Symptoms:** User found but password validation fails

**Possible Causes & Solutions:**

- **Password not hashed during registration:** Ensure passwords are hashed with bcrypt when creating users
- **Wrong bcrypt version:** Backend uses `bcrypt` (not `bcryptjs`) - ensure consistency
- **Plain text password in database:** Check if password is properly hashed:
  ```sql
  SELECT motDePasse FROM utilisateur WHERE nomUser = 'your_username';
  -- Should start with $2a$, $2b$, or $2y$ (bcrypt format)
  ```

### 3. **"Token manquant ou invalide" (Missing or invalid token)**

**Symptoms:** API calls fail with 401 Unauthorized

**Possible Causes & Solutions:**

- **JWT_SECRET not set:** Check if `.env` file exists with `JWT_SECRET` variable
- **Token expired:** JWT tokens expire after 1 hour by default
- **Malformed token:** Ensure token is sent as `Bearer <token>` in Authorization header
- **localStorage cleared:** Check browser developer tools → Application → Local Storage

### 4. **CORS Errors**

**Symptoms:** Browser console shows CORS errors

**Solutions:**

- Backend has CORS enabled for all origins by default
- Ensure frontend calls `http://localhost:5000/api`
- Check if backend server is running on port 5000

### 5. **API Endpoint Not Found (404)**

**Symptoms:** "POST /api/utilisateurs/login" returns 404

**Solution:** The correct endpoint is `/api/auth/login` (not `/api/utilisateurs/login`)

## Testing Authentication

### 1. Test Login with Username:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nomUser":"admin","motDePasse":"password123"}'
```

### 2. Test Login with Email:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","motDePasse":"password123"}'
```

### 3. Test Protected Endpoint:

```bash
curl -X GET http://localhost:5000/api/utilisateurs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Decode JWT Token (for debugging):

```bash
# Install jwt-cli or use online decoder
echo "YOUR_JWT_TOKEN" | jwt decode -
```

## Database Schema Verification

Ensure your database has the correct structure:

```sql
-- Check utilisateur table
DESCRIBE utilisateur;
-- Should have: matricule, nomUser, motDePasse, role

-- Check personne table
DESCRIBE personne;
-- Should have: matricule, nom, prenom, email

-- Check if tables are linked
SELECT u.nomUser, p.email
FROM utilisateur u
JOIN personne p ON u.matricule = p.matricule;
```

## Frontend Debugging

### Check Browser Developer Tools:

1. **Network Tab:** Look for failed API calls
2. **Console Tab:** Check for JavaScript errors
3. **Application Tab → Local Storage:** Verify token and user data are stored

### Common Frontend Issues:

- **Wrong API endpoint:** Frontend calls `/auth/login` ✓
- **Wrong payload format:** Sends `{email/nomUser, motDePasse}` ✓
- **Token not stored:** Check localStorage after successful login
- **Token not sent:** Axios interceptor should add Authorization header automatically

## Environment Setup

### Backend .env file:

```env
JWT_SECRET=your_secure_random_string_here
```

### Frontend Environment:

- Ensure `VITE_API_URL` or equivalent points to `http://localhost:5000/api`
- Check if frontend dev server is running (usually port 3000 or 5173)

## Step-by-Step Debugging Process

1. **Check backend server is running:**

   ```bash
   curl http://localhost:5000/
   # Should return "Backend de l'application...est en ligne !"
   ```

2. **Verify database connection:**

   - Check `back/conndb.ts` for correct database credentials
   - Ensure MySQL server is running

3. **Test user exists:**

   ```sql
   SELECT u.*, p.email FROM utilisateur u
   LEFT JOIN personne p ON u.matricule = p.matricule
   WHERE u.nomUser = 'test_user' OR p.email = 'test@example.com';
   ```

4. **Test password hashing:**

   ```javascript
   // In Node.js REPL
   const bcrypt = require("bcrypt");
   const hashed = await bcrypt.hash("testpassword", 10);
   console.log(hashed); // Should start with $2a$ or $2b$
   ```

5. **Check JWT token generation:**
   ```javascript
   const jwt = require("jsonwebtoken");
   const token = jwt.sign({ test: "data" }, "your_jwt_secret");
   console.log(token);
   ```

## Quick Fix Commands

### Reset User Password (for testing):

```sql
UPDATE utilisateur
SET motDePasse = '$2a$10$example.hashed.password.here'
WHERE nomUser = 'test_user';
```

### Generate a test JWT token:

```bash
node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign({ matricule: 'TEST001', role: 'Administrateur' }, 'your_jwt_secret', { expiresIn: '1h' }));
"
```

## Production Considerations

- Change `JWT_SECRET` to a long, random string
- Use HTTPS in production
- Implement token refresh mechanism
- Add rate limiting for login attempts
- Store tokens in httpOnly cookies instead of localStorage for better security
