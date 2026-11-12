# Direct Google sign-in

The studio requires an authenticated account. Direct Google login uses the server authorization-code flow, PKCE, one-use state and nonce, and verifies Google's signed ID token. Sessions are private, HttpOnly, Secure cookies backed by D1. Only basic name and email scopes are requested. Existing Sites sign-in remains available for existing users to connect Google without losing their drafts.

## Owner setup

1. Open Google Cloud Console and select the project owned by Jashntoons.
2. In Google Auth Platform, configure the app name **Jashntoons**, support email and audience. While testing, add your Gmail address as a test user. Publish the OAuth app for general customers when ready.
3. Create an OAuth client with application type **Web application**.
4. Add the authorized redirect URI exactly: `https://jashntoons.ai/api/auth/google/callback`.
5. Save the client values in this checkout's ignored `.dev.vars` file:

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

6. Synchronize both values to the site's private runtime settings and deploy. The client secret must be marked secret. Do not send credentials in chat or add them to source control. A local file alone does not activate the production connection.
7. Test on `https://jashntoons.ai`: Continue with Google, choose an account, return to the studio, save a draft, sign out and sign in again. If Google shows `redirect_uri_mismatch`, check step 4. A testing-mode client admits only configured test users.

Existing customers should first open their existing account, then choose **Connect my Google account** in My reels. This keeps the same data owner and reel balance. An already-linked Google account cannot be attached to another account.

The primary Google button is only enabled when both runtime credentials are configured. No Google login is claimed successful until the real callback is tested.

Reference: [Google's OpenID Connect documentation](https://developers.google.com/identity/openid-connect/openid-connect).
