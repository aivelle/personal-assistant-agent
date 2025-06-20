// src/utils/session.js
// Session management for AIVELLE

export class SessionManager {
  constructor(kv) {
    this.kv = kv;
  }

  async createSession(provider, tokens, userInfo) {
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const sessionData = {
      id: sessionId,
      provider,
      tokens,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      createdAt: Date.now(),
      expiresAt
    };

    await this.kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
      expirationTtl: 30 * 24 * 60 * 60 // 30 days in seconds
    });

    return sessionData;
  }

  async getSession(sessionId) {
    if (!sessionId) return null;
    
    const sessionData = await this.kv.get(`session:${sessionId}`);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await this.kv.delete(`session:${sessionId}`);
      return null;
    }

    return session;
  }

  async deleteSession(sessionId) {
    if (!sessionId) return;
    await this.kv.delete(`session:${sessionId}`);
  }

  createSessionCookie(sessionId) {
    return `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`;
  }

  getSessionIdFromRequest(request) {
    // Try cookie first
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      if (cookies.sessionId) {
        return cookies.sessionId;
      }
    }

    // Try Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
} 