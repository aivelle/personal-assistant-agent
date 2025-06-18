/**
 * Google OAuth 인증 리디렉션 엔드포인트
 * GET /oauth/google
 */
export async function handleGoogleOAuthRequest(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = 'https://yourdomain.com/oauth/google/callback';
  const scope = 'https://www.googleapis.com/auth/calendar';
  const state = 'random_state_string'; // TODO: CSRF 방지용 state 생성

  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;
  return Response.redirect(url, 302);
}

/**
 * Google OAuth 콜백 엔드포인트
 * GET /oauth/google/callback
 */
import { saveUserOAuthData } from '../utils/oauth.js';

export async function handleGoogleOAuthCallback(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  // TODO: 에러 처리, state 검증 등

  // 토큰 교환
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://yourdomain.com/oauth/google/callback',
      grant_type: 'authorization_code'
    })
  });
  const tokenData = await tokenRes.json();

  // 예시: userId는 email 또는 sub(구글 계정 고유값)로 대체 필요
  const userId = tokenData.id_token || 'google_user';
  await saveUserOAuthData(userId, {
    provider: 'google',
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    scope: tokenData.scope
  });

  // 인증 성공 후 프론트엔드로 리디렉션
  return Response.redirect('/onboarding/success', 302);
} 