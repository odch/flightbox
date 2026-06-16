# Custom Email Authentication Setup

This document explains how to set up custom email authentication for the email sign-in code to avoid emails going to spam folders using Mailgun SMTP.

## Overview

The email login uses a single-use 6-digit code. A Cloud Function issues the code and sends it via Mailgun SMTP using nodemailer; the client then exchanges the code for a session. SMTP settings are stored in Firebase database for easy configuration.

## Architecture

1. **Client-side**: the email login form calls `generateSignInCode`, then `verifySignInCode` with the code the user received
2. **Cloud Function**: `generateSignInCode` creates a single-use 6-digit code, stores its hash, and triggers the email
3. **Email Service**: `sendSignInEmail` reads SMTP settings from `/settings/emailSmtp` and emails the code via Mailgun SMTP

## Firebase Database Structure

You need to add the following structure to your Firebase Realtime Database at `/settings/emailSmtp`:

```json
{
  "settings": {
    "emailSmtp": {
      "host": "smtp.mailgun.org",
      "port": "465",
      "user": "postmaster@mg.yourdomain.com",
      "password": "your-mailgun-smtp-password",
      "fromEmail": "noreply@yourdomain.com",
      "fromName": "Flightbox"
    }
  }
}
```

### Required Fields

- **`host`**: SMTP server hostname (for Mailgun: `smtp.mailgun.org`)
- **`port`**: SMTP port (587 for TLS, 465 for SSL, 25 for unencrypted)
- **`user`**: SMTP username (for Mailgun: your domain's SMTP credentials)
- **`password`**: SMTP password (for Mailgun: your domain's SMTP password)
- **`fromEmail`**: The email address that emails will be sent from
- **`fromName`**: The display name for the sender

### Mailgun SMTP Setup

1. **Create Mailgun Account**: Sign up at [mailgun.com](https://mailgun.com)

2. **Add and Verify Your Domain**: 
   - Add your domain in the Mailgun dashboard
   - Add the required DNS records (MX, TXT, CNAME)
   - Wait for verification

3. **Get SMTP Credentials**:
   - Go to Domains > [Your Domain] > Domain Settings
   - Find "SMTP credentials" section
   - Use the provided username and password

4. **Common Mailgun SMTP Settings**:
   ```
   Host: smtp.mailgun.org (US) or smtp.eu.mailgun.org (EU)
   Port: 587 (TLS) or 465 (SSL)
   Username: postmaster@mg.yourdomain.com
   Password: [from Mailgun dashboard]
   ```

## Implementation Steps

### 1. Set up Firebase Database

Add your Mailgun SMTP settings to Firebase Realtime Database at `/settings/emailSMTP` with the structure shown above.

### 2. Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### 3. Update Project Configuration

In your webpack config or build process, make sure `__FIREBASE_PROJECT_ID__` is set correctly.

### 4. Test the Implementation

1. Deploy your functions and client-side changes
2. Try the email authentication flow
3. Check that emails are delivered to your inbox (not spam)
4. Monitor Firebase Functions logs for any errors

## Testing Your Setup

### Test Code Generation
```bash
curl -X POST https://europe-west1-YOUR-PROJECT-ID.cloudfunctions.net/generateSignInCode \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Customizing Email Templates

The email template is defined in `functions/auth/sendSignInEmail.js`. You can customize:

- **Subject line**: Modify `emailSubject` variable
- **HTML content**: Edit the `emailHtml` template
- **Plain text**: Update the `emailText` content
- **Styling**: Modify the inline CSS in the HTML template

## Security Considerations

1. **Database Security**: Ensure your Firebase database rules protect the `/settings` node from unauthorized access
2. **SMTP Credentials**: Keep your Mailgun SMTP credentials secure
3. **Domain Verification**: Verify your sending domain with Mailgun for better deliverability
4. **Rate Limiting**: Consider implementing rate limiting to prevent email abuse
5. **Code Expiration**: sign-in codes are single-use and expire shortly after they are issued

## Troubleshooting

### Common Issues

1. **SMTP settings not found**: Ensure `/settings/emailSMTP` exists in your Firebase database
2. **Authentication failed**: Check your Mailgun SMTP credentials
3. **Email not delivered**: Verify your domain and check Mailgun logs
4. **Functions error**: Check Firebase Functions logs with `firebase functions:log`

### Debugging Steps

1. **Check Database Settings**:
   Verify the SMTP settings structure in Firebase Console

2. **Monitor Function Logs**:
   ```bash
   firebase functions:log --only sendSignInEmail,generateSignInCode
   ```

3. **Test SMTP Connection**:
   The function will log connection errors if SMTP fails

4. **Check Mailgun Dashboard**:
   Monitor your Mailgun dashboard for delivery status and logs

## DNS Configuration for Better Deliverability

To avoid emails going to spam, configure these DNS records for your domain:

### SPF Record
```
TXT @ "v=spf1 include:mailgun.org ~all"
```

### DKIM Record
Add the DKIM record provided by Mailgun in your dashboard.

### DMARC Record (Optional)
```
TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

## Production Checklist

- [ ] Mailgun account set up and domain verified
- [ ] DNS records (SPF, DKIM) configured
- [ ] SMTP settings added to Firebase database `/settings/emailSMTP`
- [ ] Functions deployed to production
- [ ] Client-side code updated and deployed
- [ ] Email templates customized for your brand
- [ ] Test email delivery to multiple email providers (Gmail, Outlook, etc.)
- [ ] Monitor delivery rates and spam reports
- [ ] Set up monitoring/alerting for function errors

## Advantages of This Approach

✅ **No Spam Issues**: Professional SMTP service with good reputation  
✅ **Database Configuration**: Easy to update settings without redeploying  
✅ **Cost Effective**: Mailgun has generous free tiers  
✅ **Reliable**: Enterprise-grade email delivery  
✅ **Monitoring**: Detailed delivery analytics in Mailgun dashboard  
✅ **Firebase Security**: Links still generated securely by Firebase  

## Support Resources

- [Mailgun SMTP Documentation](https://documentation.mailgun.com/en/latest/user_manual.html#smtp-relay)
- [Firebase Admin SDK Email Links](https://firebase.google.com/docs/auth/admin/email-action-links)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Firebase Database Security Rules](https://firebase.google.com/docs/database/security)
