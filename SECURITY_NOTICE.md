# ⚠️ SECURITY & CREDENTIALS ALERT

## Critical Actions Required

Your API credentials have been exposed in this conversation. **You must take immediate action:**

### 1. IMMEDIATELY Rotate All Credentials

#### Cloudinary
1. Go to https://cloudinary.com/console/c-settings/api-keys
2. Click "Generate new API key"
3. Delete the old API key (634886313549162)
4. Update your `.env.local` with the new credentials

**Credentials to rotate:**
- API Key: `634886313549162`
- API Secret: `46ONNX5XGTGFMETtVJCqVi-WcCs`

#### Brevo (Email Service)
1. Go to https://app.brevo.com/settings/keys/api
2. Generate a new API key
3. Delete the exposed key
4. Update your `.env.local` with the new credentials

**Credentials to rotate:**
- API Key: `os_v2_app_vu2gybuvfrcnndp5rwejw7xhxm3ftcybkxse6ynbgo2rlkbwpk4jdnyxlzpoczshg7oerzs4x2mwsljm6tvu47cheynza2ylwbvdikq`
- API Secret: `3ftcybkxse6ynbgo2rlkbwpk4`

### 2. Secure Your Environment

#### Never commit `.env.local` files
Update your `.gitignore`:
```
# Environment files
.env
.env.local
.env.*.local
.env.production.local
.secrets/
secrets/

# Do NOT commit credentials!
```

#### Use secrets management for production
- **Vercel**: Vercel Secrets Manager
- **Netlify**: Environment variables
- **AWS**: Secrets Manager or Parameter Store
- **Heroku**: Config Vars
- **GCP**: Secret Manager
- **Azure**: Key Vault

### 3. Check for Exposure

#### In your repository:
```bash
# Check if credentials were ever committed
git log --all -p -S "46ONNX5XGTGFMETtVJCqVi-WcCs"
git log --all -p -S "BREVO_API_KEY"

# If found, use git-filter-repo to remove:
# (This is advanced - seek professional help if needed)
```

#### Monitor for unauthorized usage:
- **Cloudinary**: Check API usage logs for suspicious activity
- **Brevo**: Check email sending logs for unauthorized emails

---

## Environment Variable Security Best Practices

### 1. Local Development
```bash
# Create .env.local (NEVER commit this)
CLOUDINARY_API_KEY=your_new_key_here
BREVO_API_KEY=your_new_key_here

# Add to .gitignore
echo ".env.local" >> .gitignore
```

### 2. Production Deployment

#### Vercel (Recommended for Next.js)
```bash
# Set secrets via CLI
vercel env add CLOUDINARY_API_KEY
vercel env add BREVO_API_KEY

# Or via Vercel Dashboard:
# Project Settings → Environment Variables
```

#### Netlify
```bash
# Via Site Settings → Build & Deploy → Environment
# Add variables there, not in code
```

#### Docker/Self-hosted
```bash
# Use environment variable files
docker run -e CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY" ...

# Or use Docker secrets
docker secret create api_key -
docker service create --secret api_key ...
```

### 3. CI/CD Pipelines

#### GitHub Actions
```yaml
env:
  CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
  BREVO_API_KEY: ${{ secrets.BREVO_API_KEY }}
```

#### GitLab CI
```yaml
variables:
  CLOUDINARY_API_KEY: $CLOUDINARY_API_KEY
  BREVO_API_KEY: $BREVO_API_KEY
```

---

## What Could Go Wrong If Not Fixed

### If credentials remain exposed:

1. **Unauthorized File Uploads**
   - Attackers can upload content to your Cloudinary account
   - Could consume your bandwidth and storage limits
   - Malicious content could damage your brand

2. **Email Abuse**
   - Attackers can send emails from your Brevo account
   - Your sending reputation could be damaged
   - Could result in account suspension
   - Legal liability for spam

3. **Financial Impact**
   - Cloudinary charges for bandwidth and storage
   - Brevo charges for email sends
   - Unauthorized activity could rack up significant fees

4. **Data Exposure**
   - Attackers could access or delete your files
   - Email logs could reveal sensitive information
   - Breach of user privacy and trust

---

## After Rotating Credentials

### Update Your Code

1. **Server .env.local**
```env
CLOUDINARY_API_KEY=NEW_KEY_HERE
CLOUDINARY_API_SECRET=NEW_SECRET_HERE
BREVO_API_KEY=NEW_KEY_HERE
```

2. **Client .env.local**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

3. **Deployment Platform**
   - Update secrets in Vercel/Netlify/AWS/etc.
   - Re-deploy your application

4. **Test Everything**
   - Test file uploads
   - Test email sending
   - Check admin dashboard

### Verification Checklist

- [ ] New Cloudinary API key generated and old one deleted
- [ ] New Brevo API key generated and old one deleted
- [ ] `.env.local` files updated with new credentials
- [ ] `.gitignore` includes `.env.local`
- [ ] Production secrets updated
- [ ] Application re-deployed
- [ ] File uploads working (Cloudinary)
- [ ] Emails sending (Brevo)
- [ ] No errors in logs
- [ ] Monitored for unauthorized usage
- [ ] Team notified of credential rotation

---

## Additional Security Recommendations

### 1. API Key Rotation Schedule
- Rotate credentials every 90 days
- Immediately rotate if exposed/compromised
- Keep previous key active for 24 hours during rotation

### 2. Access Control
- Limit API key permissions to minimum required
  - Cloudinary: Only upload to specific folder
  - Brevo: Only send emails (no list management)
- Create separate keys for development/staging/production
- Use service accounts instead of personal accounts

### 3. Monitoring & Auditing
```typescript
// Log all file uploads
console.log(`File uploaded: ${publicId} by ${userId}`);

// Log all emails sent
console.log(`Email sent to ${recipient} by ${userId}`);

// Alert on unusual activity
if (dailyUploadCount > THRESHOLD) {
  alertSecurityTeam('Unusual upload activity detected');
}
```

### 4. Rate Limiting (Already implemented)
- Withdrawal requests: 3 per hour per user
- API calls: 100 per 15 minutes
- Email sends: Protected by Brevo rate limits

### 5. Input Validation
```typescript
// Always validate and sanitize inputs
const emailAddress = sanitizeEmail(req.body.email);
const walletAddress = validateWalletAddress(req.body.destination);
```

---

## Contact & Resources

### Official Documentation
- [Cloudinary API Keys](https://cloudinary.com/documentation/cloudinary_credentials_and_keys)
- [Brevo API Documentation](https://developers.brevo.com)
- [OWASP: Secrets Management](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/04-Testing_for_Exposed_Session_Variables.html)

### Tools for Credential Detection
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Finds exposed secrets
- [GitGuardian](https://www.gitguardian.com) - Real-time secret scanning
- [detect-secrets](https://github.com/Yelp/detect-secrets) - Pre-commit hook

### Incident Response
If you discover unauthorized access:
1. Immediately disable the compromised API keys
2. Check access logs for suspicious activity
3. Document what was accessed/modified
4. Report to affected users if data was exposed
5. Update your systems and monitoring

---

## Next Steps

1. **Right Now**: Rotate credentials (5 minutes)
2. **Today**: Update code and redeploy (30 minutes)
3. **This Week**: Set up monitoring and alerting
4. **This Month**: Review and update security practices

**Your action is required to secure the platform.**

