// src/utils/oauth.js

// Cloudflare Workers 환경에서는 KV 네임스페이스를 사용해야 합니다.
// wrangler.toml에 다음과 같이 바인딩 필요:
// [[kv_namespaces]]
// binding = "USERS_KV"
// id = "..."

/**
 * 사용자 정보(users) KV에 토큰/정보 저장
 * @param {string} userId
 * @param {object} data (access_token, refresh_token, workspace_id 등)
 * @param {object} env (Cloudflare Workers 환경 변수)
 */
export async function saveUserOAuthData(userId, data, env) {
  await env.USERS_KV.put(`user:${userId}`, JSON.stringify(data));
}

/**
 * 사용자 정보(users) KV에서 토큰/정보 불러오기
 * @param {string} userId
 * @param {object} env (Cloudflare Workers 환경 변수)
 * @returns {object|null}
 */
export async function getUserOAuthData(userId, env) {
  const raw = await env.USERS_KV.get(`user:${userId}`);
  return raw ? JSON.parse(raw) : null;
}

// (로컬 개발용 파일 기반 예시는 주석 처리)
// import fs from 'fs/promises';
// const USERS_PATH = './configs/users.json';
// ... 기존 파일 기반 함수 ... 