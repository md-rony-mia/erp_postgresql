# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Nexova ERP, please report it responsibly:

1. **DO NOT** open a public issue
2. Email security concerns to: security@nexova-erp.com (or your contact)
3. Include detailed reproduction steps and impact assessment
4. Allow up to 48 hours for initial response

## Security Checklist for Production Deployment

- [ ] Firestore Security Rules are properly configured (NOT using default open rules)
- [ ] `AI_FEATURE_ENABLED` is set to `false` until AI rate limiting is verified
- [ ] `GEMINI_API_KEY` is stored as a server-side secret only
- [ ] HTTPS is enforced in production
- [ ] Firebase App Check is enabled
- [ ] All environment variables are set (no placeholder values)
- [ ] Non-root user runs the Docker container
- [ ] Rate limiting is active on all API endpoints
- [ ] Helmet.js CSP headers are configured for your domain
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] CI/CD pipeline passes all checks before deployment

## Known Security Considerations

1. **Firebase Auth**: The application uses Firebase Authentication. Ensure your Firebase project has:
   - Email enumeration protection enabled
   - Password policy configured
   - Multi-factor authentication enabled for admin accounts

2. **Firestore Rules**: Security rules enforce role-based access. Regularly audit rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **AI Endpoint**: The `/api/gemini/generate` endpoint has rate limiting but should be
   monitored for abuse. Consider adding IP-based blocking for repeated violations.

4. **Audit Logs**: All data mutations are logged to the `audit_logs` collection.
   Administrators should regularly review these logs for suspicious activity.
