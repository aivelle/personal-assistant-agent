/**
 * Notion OAuth 인증 리디렉션 엔드포인트
 * GET /oauth/notion
 */
export async function handleNotionOAuthRequest(request) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = 'https://yourdomain.com/oauth/notion/callback';
  const state = 'random_state_string'; // TODO: CSRF 방지용 state 생성

  const url = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
  return Response.redirect(url, 302);
}

/**
 * Notion OAuth 콜백 엔드포인트
 * GET /oauth/notion/callback
 */
export async function handleNotionOAuthCallback(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  // TODO: 에러 처리, state 검증 등

  // 토큰 교환
  const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://yourdomain.com/oauth/notion/callback',
    }),
    auth: `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  });
  const tokenData = await tokenRes.json();

  // TODO: users.json에 access_token, workspace_id 등 저장

  return new Response('Notion 인증 완료! 이제 서비스를 이용할 수 있습니다.');
} 