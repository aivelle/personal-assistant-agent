/**
 * Notion OAuth 인증 리디렉션 엔드포인트
 * GET /oauth/notion
 */
import { saveOAuthState, verifyOAuthState, saveUserOAuthData, createOAuthErrorResponse, createOAuthSuccessResponse } from '../utils/oauth.js';
import logger from '../utils/logger.js';

export async function handleNotionOAuthRequest(request, env, responseHeaders = {}) {
  // ✅ I: Input → 사용자 요청 감지 및 메타 체크
  const headers = request.headers;
  const userAgent = headers.get("User-Agent") || "";
  const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
  const referer = headers.get("Referer") || "";
  const clientIp = headers.get("CF-Connecting-IP") || "";

  // 기본 메타데이터
  const meta = {
    requestId,
    clientIp,
    userAgent,
    referer
  };

  // 루프 위험 판단
  if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
    logger.warn("Loop detected in Notion OAuth request", {
      ...meta,
      reason: "loop_detected"
    });
    return new Response("Loop detected and blocked", { 
      status: 429,
      headers: {
        "X-Error-Type": "loop_detected",
        "Retry-After": "60"
      }
    });
  }

  // ✅ V: Validate → 요청 깊이, 반복 여부 검사
  const depth = Number(headers.get("X-Depth") || "0");
  if (depth > 3) {
    logger.warn("Request depth exceeded in Notion OAuth", {
      ...meta,
      depth,
      reason: "depth_exceeded"
    });
    return new Response("Request depth limit exceeded", { 
      status: 400,
      headers: { "X-Error-Type": "depth_exceeded" }
    });
  }

  // ✅ L: Log & Launch → 요청 기록
  logger.apiRequest("GET", "/oauth/notion", meta);

  // 실제 OAuth 처리 로직
  const clientId = env.NOTION_CLIENT_ID;
  if (!clientId) {
    logger.error("Notion OAuth client ID is not configured", meta);
    return createOAuthErrorResponse('Notion OAuth client ID is not configured', 500);
  }

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/notion/callback`;
  
  // Generate and save state for CSRF protection
  const state = crypto.randomUUID();
  await saveOAuthState(state, env);
  
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&owner=user&state=${state}`;
  
  // Return HTML response with tracking headers
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Notion OAuth Authentication</title>
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
            background-color: #000000;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #333333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Notion Authentication</h1>
          <a href="${authUrl}" class="button">Continue with Notion</a>
        </div>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      ...responseHeaders
    },
  });
}

/**
 * Notion OAuth 콜백 엔드포인트
 * GET /oauth/notion/callback
 */
export async function handleNotionOAuthCallback(request, env, responseHeaders = {}) {
  // ✅ I: Input → 사용자 요청 감지 및 메타 체크
  const headers = request.headers;
  const userAgent = headers.get("User-Agent") || "";
  const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
  const referer = headers.get("Referer") || "";
  const clientIp = headers.get("CF-Connecting-IP") || "";

  // 기본 메타데이터
  const meta = {
    requestId,
    clientIp,
    userAgent,
    referer
  };

  // 루프 위험 판단
  if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
    logger.warn("Loop detected in Notion OAuth callback", {
      ...meta,
      reason: "loop_detected"
    });
    return new Response("Loop detected and blocked", { 
      status: 429,
      headers: {
        "X-Error-Type": "loop_detected",
        "Retry-After": "60"
      }
    });
  }

  // ✅ V: Validate → 요청 깊이, 반복 여부 검사
  const depth = Number(headers.get("X-Depth") || "0");
  if (depth > 3) {
    logger.warn("Request depth exceeded in Notion OAuth callback", {
      ...meta,
      depth,
      reason: "depth_exceeded"
    });
    return new Response("Request depth limit exceeded", { 
      status: 400,
      headers: { "X-Error-Type": "depth_exceeded" }
    });
  }

  // ✅ L: Log & Launch → 요청 기록
  logger.apiRequest("GET", "/oauth/notion/callback", meta);

  // 실제 OAuth 콜백 처리 로직
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle error from Notion
  if (error) {
    logger.error(`[OAuth Error] ${requestId} Notion error: ${error}`, meta);
    return createOAuthErrorResponse(`Authentication Error: ${error}`);
  }

  if (!code) {
    logger.warn(`[OAuth Error] ${requestId} Missing code`, meta);
    return createOAuthErrorResponse('Authorization code is missing');
  }

  // Verify state parameter to prevent CSRF attacks
  const isValidState = await verifyOAuthState(state, env);
  if (!isValidState) {
    logger.warn(`[OAuth Error] ${requestId} Invalid state`, meta);
    return createOAuthErrorResponse('Invalid state parameter');
  }
  
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/notion/callback`;

  try {
    // Exchange code for tokens with retry logic
    let tokenData;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`)}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
            'User-Agent': 'Aivelle-OAuth-Client/1.0'
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri
          })
        });

        if (!tokenRes.ok) {
          const errorData = await tokenRes.text();
          throw new Error(`Token exchange failed: ${errorData}`);
        }

        tokenData = await tokenRes.json();
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Get workspace info
    const workspaceId = tokenData.workspace_id;
    const botId = tokenData.bot_id;
    const accessToken = tokenData.access_token;

    // Save OAuth data with retry logic
    let saveAttempt = 0;
    while (saveAttempt < 3) {
      try {
        await saveUserOAuthData(workspaceId, {
          provider: 'notion',
          access_token: accessToken,
          bot_id: botId,
          workspace_id: workspaceId,
          owner: tokenData.owner,
          workspace_name: tokenData.workspace_name,
          workspace_icon: tokenData.workspace_icon,
          last_auth: new Date().toISOString()
        }, env);
        break;
      } catch (error) {
        saveAttempt++;
        if (saveAttempt === 3) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempt));
      }
    }

    logger.info(`[OAuth Success] ${requestId} Workspace ${workspaceId} authenticated`, {
      ...meta,
      workspace_id: workspaceId
    });

    // Return success page with tracking headers
    const response = createOAuthSuccessResponse('Successfully authenticated with Notion!');
    response.headers = new Headers({
      ...response.headers,
      ...responseHeaders
    });
    return response;

  } catch (error) {
    logger.error(`[OAuth Error] ${requestId} Authentication failed: ${error.message}`, {
      ...meta,
      error: error.message,
      stack: error.stack
    });
    return createOAuthErrorResponse(`Authentication failed: ${error.message}`, 500);
  }
} 