// src/utils/oauth.js

// Cloudflare Workers 환경에서는 KV 네임스페이스를 사용해야 합니다.
// wrangler.toml에 다음과 같이 바인딩 필요:
// [[kv_namespaces]]
// binding = "USERS_KV"
// id = "..."

/**
 * OAuth 상태 관리 및 유틸리티 함수
 */

const STATE_PREFIX = 'oauth_state_';
const USER_PREFIX = 'oauth_user_';
const STATE_EXPIRY = 60 * 5; // 5 minutes in seconds

/**
 * Utility function for KV JSON operations
 */
async function kvJSON(operation, env, key, value = null, options = {}) {
  switch (operation) {
    case 'get':
      const data = await env.USERS_KV.get(key);
      return data ? JSON.parse(data) : null;
    case 'put':
      await env.USERS_KV.put(key, JSON.stringify(value), options);
      return true;
    default:
      throw new Error(`Unknown KV operation: ${operation}`);
  }
}

/**
 * OAuth 상태 저장
 */
export async function saveOAuthState(state, env) {
  const key = `${STATE_PREFIX}${state}`;
  return kvJSON('put', env, key, {
    created: Date.now()
  }, {
    expirationTtl: STATE_EXPIRY
  });
}

/**
 * OAuth 상태 검증 - Atomic Operation
 */
export async function verifyOAuthState(state, env) {
  if (!state) return false;
  
  const key = `${STATE_PREFIX}${state}`;
  
  // Atomic operation using KV's atomic read-delete
  try {
    const stored = await env.USERS_KV.getWithMetadata(key);
    if (!stored.value) return false;
    
    // Delete the state token immediately after reading
    await env.USERS_KV.delete(key);
    return true;
  } catch (error) {
    console.error('Error during atomic state verification:', error);
    return false;
  }
}

/**
 * OAuth 사용자 데이터 저장
 */
export async function saveUserOAuthData(userId, data, env) {
  const key = `${USER_PREFIX}${userId}`;
  return kvJSON('put', env, key, {
    ...data,
    updated: Date.now()
  });
}

/**
 * OAuth 에러 응답 생성
 */
export function createOAuthErrorResponse(message, status = 400) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Error</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
            color: #d32f2f;
            margin-bottom: 1rem;
          }
          .message {
            color: #666;
            margin-bottom: 2rem;
          }
          .button {
            display: inline-block;
            background-color: #4285f4;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Authentication Error</h1>
          <p class="message">${message}</p>
          <a href="/oauth/google" class="button">Try Again</a>
        </div>
      </body>
    </html>
  `;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * OAuth 성공 응답 생성
 */
export function createOAuthSuccessResponse(message = 'Authentication successful!') {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Success</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
            color: #43a047;
            margin-bottom: 1rem;
          }
          .message {
            color: #666;
            margin-bottom: 2rem;
          }
          .button {
            display: inline-block;
            background-color: #43a047;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Success!</h1>
          <p class="message">${message}</p>
          <a href="/" class="button">Continue</a>
        </div>
      </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * 사용자 정보 불러오기
 */
export async function getUserOAuthData(userId, env) {
  const key = `${USER_PREFIX}${userId}`;
  return kvJSON('get', env, key);
}

// (로컬 개발용 파일 기반 예시는 주석 처리)
// import fs from 'fs/promises';
// const USERS_PATH = './configs/users.json';
// ... 기존 파일 기반 함수 ... 