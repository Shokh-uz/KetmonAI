# Social Login Setup Guide

This guide will help you set up Google and Facebook login for your website.

## Prerequisites

You need to obtain credentials from both Google and Facebook:

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost` (for local testing)
     - `https://yourdomain.com` (your production domain)
   - Add authorized redirect URIs:
     - `http://localhost` (for local testing)
     - `https://yourdomain.com` (your production domain)
5. Copy your **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### 2. Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Choose "Consumer" or "Business" app type
4. Fill in app details:
   - App Name: Your website name
   - App Contact Email: Your email
5. Add Facebook Login product:
   - In the app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
6. Configure Facebook Login:
   - Go to "Facebook Login" > "Settings"
   - Add Valid OAuth Redirect URIs:
     - `http://localhost` (for local testing)
     - `https://yourdomain.com` (your production domain)
7. Copy your **App ID** (it's a number like: `1234567890123456`)

## Configuration Steps

### Step 1: Update Google Client ID

1. Open `script.js`
2. Find the line:
   ```javascript
   var GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Google Client ID:
   ```javascript
   var GOOGLE_CLIENT_ID = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
   ```

### Step 2: Update Facebook App ID

1. Open `index.html`
2. Find the line in the Facebook SDK initialization:
   ```javascript
   appId: 'YOUR_FACEBOOK_APP_ID',
   ```
3. Replace `YOUR_FACEBOOK_APP_ID` with your actual Facebook App ID:
   ```javascript
   appId: '1234567890123456',
   ```

4. Also update in `script.js`:
   ```javascript
   var FACEBOOK_APP_ID = '1234567890123456';
   ```

### Step 3: Test the Integration

1. Open your website in a browser
2. Click the login button
3. Try clicking "Google bilan kirish" - it should open Google sign-in
4. Try clicking "Facebook bilan kirish" - it should open Facebook login

## Troubleshooting

### Google Login Issues

- **"Google Identity Services yuklanmagan"**: Make sure the Google Identity Services script is loaded. Check browser console for errors.
- **"Google Client ID sozlanmagan"**: Make sure you've replaced `YOUR_GOOGLE_CLIENT_ID` in `script.js`
- **"Invalid origin"**: Add your domain to authorized JavaScript origins in Google Cloud Console

### Facebook Login Issues

- **"Facebook SDK yuklanmagan"**: Make sure the Facebook SDK script is loaded. Check browser console for errors.
- **"Facebook App ID sozlanmagan"**: Make sure you've replaced `YOUR_FACEBOOK_APP_ID` in both `index.html` and `script.js`
- **"App Not Setup"**: Make sure Facebook Login product is added and configured in Facebook App settings

## Security Notes

⚠️ **Important**: The current implementation decodes JWT tokens client-side for demo purposes. In production, you should:

1. Send the credential to your backend server
2. Verify the token on the server
3. Create a session or return a secure token
4. Never trust client-side decoded tokens in production

## Support

If you need help:
1. Check browser console for error messages
2. Verify your credentials are correct
3. Make sure your domains are added to authorized origins/redirects
4. Test in an incognito/private window to avoid cached credentials

