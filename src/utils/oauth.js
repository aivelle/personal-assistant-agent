// src/utils/oauth.js

// NOTE: Cloudflare Workers 환경에서는 KV, Durable Objects, 혹은 외부 DB를 권장합니다.
// 아래는 파일 기반 예시(로컬 개발용). 실제 서비스에서는 KV로 대체 필요.

import fs from 'fs/promises';
const USERS_PATH = './configs/users.json';

/**
 * 사용자 정보(users.json)에 토큰/정보 저장
 * @param {string} userId
 * @param {object} data (access_token, refresh_token, workspace_id 등)
 */
export async function saveUserOAuthData(userId, data) {
  let users = {};
  try {
    const raw = await fs.readFile(USERS_PATH, 'utf-8');
    users = JSON.parse(raw);
  } catch (e) {
    // 파일 없으면 새로 생성
    users = {};
  }
  users[userId] = { ...(users[userId] || {}), ...data };
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
}

/**
 * 사용자 정보(users.json)에서 토큰/정보 불러오기
 * @param {string} userId
 * @returns {object|null}
 */
export async function getUserOAuthData(userId) {
  try {
    const raw = await fs.readFile(USERS_PATH, 'utf-8');
    const users = JSON.parse(raw);
    return users[userId] || null;
  } catch (e) {
    return null;
  }
} 