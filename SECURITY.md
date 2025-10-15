# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email the maintainers directly instead of creating a public issue.

## Secure Configuration

### Environment Variables

**Never commit these files:**
- `.env`
- `.env.local`
- `.env.*.local`

These files are already in `.gitignore` and should remain there.

### Firebase Security

1. **API Key Restrictions**
   - Go to Google Cloud Console → Credentials
   - Set HTTP referrer restrictions for your Web API key
   - Only allow: `yourusername.github.io/*` and `localhost:8080`

2. **Firestore Security Rules**
   - Always use production-mode rules
   - Never allow public read/write access
   - Implement role-based access control

3. **Authentication**
   - Enable only necessary sign-in methods
   - Configure authorized domains
   - Monitor suspicious activity in Firebase Console

### GitHub Secrets

Store all sensitive data in GitHub Secrets:
- Repository Settings → Secrets and variables → Actions
- Never log or expose secrets in Actions workflows
- Rotate secrets periodically

### Best Practices

1. **Regular Security Audits**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Dependency Updates**
   ```bash
   npm outdated
   npm update
   ```

3. **Monitor Firebase Usage**
   - Check Firebase Console regularly
   - Set up billing alerts
   - Review Firestore access logs

4. **Code Reviews**
   - Never commit credentials in code
   - Review all PRs for security issues
   - Use environment variables for all sensitive data

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Checklist for Contributors

Before submitting a PR:
- [ ] No credentials in code
- [ ] No credentials in commit messages
- [ ] No sensitive data in comments
- [ ] Environment variables used correctly
- [ ] Dependencies are up to date
- [ ] No security warnings in `npm audit`

## What to Do If Credentials Are Exposed

1. **Immediately rotate all exposed credentials**
2. **Revoke compromised API keys in Firebase Console**
3. **Check Firebase logs for suspicious activity**
4. **Create new Firebase project if necessary**
5. **Update GitHub Secrets**
6. **Remove credentials from Git history**

## Additional Resources

- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
