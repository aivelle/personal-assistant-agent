/**
 * Google OAuth 인증 리디렉션 엔드포인트
 * GET /oauth/google
 */
import { saveOAuthState, verifyOAuthState, saveUserOAuthData, createOAuthErrorResponse, createOAuthSuccessResponse } from '../utils/oauth.js';

export async function handleGoogleOAuthRequest(request, env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return createOAuthErrorResponse('Google OAuth client ID is not configured', 500);
  }

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/google/callback`;
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email');
  
  // Generate and save state for CSRF protection
  const state = crypto.randomUUID();
  await saveOAuthState(state, env);
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  
  // Return HTML response instead of redirect for better user experience
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google OAuth Authentication</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333;
            margin-bottom: 1.5rem;
          }
          .button {
            display: inline-block;
            background-color: #4285f4;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #357abd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Google Authentication</h1>
          <a href="${authUrl}" class="button">Continue with Google</a>
        </div>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

/**
 * Google OAuth 콜백 엔드포인트
 * GET /oauth/google/callback
 */
export async function handleGoogleOAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle error from Google
  if (error) {
    return createOAuthErrorResponse(`Authentication Error: ${error}`);
  }

  if (!code) {
    return createOAuthErrorResponse('Authorization code is missing');
  }

  // Verify state parameter to prevent CSRF attacks
  const isValidState = await verifyOAuthState(state, env);
  if (!isValidState) {
    return createOAuthErrorResponse('Invalid state parameter');
  }
  
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/google/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!userInfoRes.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await userInfoRes.json();
    const userId = userInfo.email || userInfo.id;

    // Save OAuth data
    await saveUserOAuthData(userId, {
      provider: 'google',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      email: userInfo.email
    }, env);

    // Return success page
    return createOAuthSuccessResponse('Successfully authenticated with Google!');
  } catch (error) {
    return createOAuthErrorResponse(`Authentication failed: ${error.message}`, 500);
  }
} 