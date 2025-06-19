var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/utils/logger.js
var LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};
var Logger = class {
  static {
    __name(this, "Logger");
  }
  constructor() {
    this.logLevel = LOG_LEVELS.INFO;
    this.isDevelopment = false;
  }
  setLogLevel(level) {
    if (LOG_LEVELS[level] !== void 0) {
      this.logLevel = LOG_LEVELS[level];
    }
  }
  formatMessage(level, message, meta = {}) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const requestId = meta.requestId || "NO_REQUEST_ID";
    const userId = meta.userId || "NO_USER";
    return {
      timestamp,
      level,
      requestId,
      userId,
      message,
      ...meta
    };
  }
  shouldLog(level) {
    return LOG_LEVELS[level] >= this.logLevel;
  }
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    const formattedLog = this.formatMessage(level, message, meta);
    console.log(JSON.stringify(formattedLog));
  }
  debug(message, meta = {}) {
    this.log("DEBUG", message, meta);
  }
  info(message, meta = {}) {
    this.log("INFO", message, meta);
  }
  warn(message, meta = {}) {
    this.log("WARN", message, meta);
  }
  error(message, meta = {}) {
    this.log("ERROR", message, meta);
  }
  fatal(message, meta = {}) {
    this.log("FATAL", message, meta);
  }
  // OAuth 전용 로깅 메소드
  oauthLog(status, message, meta = {}) {
    const level = status === "success" ? "INFO" : "ERROR";
    this.log(level, `[OAuth] ${message}`, {
      ...meta,
      oauth_status: status
    });
  }
  // API 요청 로깅
  apiRequest(method, path, meta = {}) {
    this.info(`API Request: ${method} ${path}`, {
      ...meta,
      http_method: method,
      path
    });
  }
  // 성능 메트릭 로깅
  logMetric(name, value, meta = {}) {
    this.info(`Metric: ${name} = ${value}`, {
      ...meta,
      metric_name: name,
      metric_value: value
    });
  }
};
var logger = new Logger();
var logger_default = logger;

// src/workflows/automation/voice_to_anywhere.js
var voice_to_anywhere_exports = {};
__export(voice_to_anywhere_exports, {
  run: () => run
});
async function run({ prompt, context }) {
  return {
    message: "Voice-based idea recorded",
    note: prompt,
    target: "Notion (or elsewhere)"
  };
}
__name(run, "run");

// src/workflows/automation/attach_image_to_any_post.js
var attach_image_to_any_post_exports = {};
__export(attach_image_to_any_post_exports, {
  run: () => run2
});
async function run2({ prompt, context }) {
  return {
    message: "Image attached to post (mock)",
    prompt,
    target: "Social Media Post (or elsewhere)"
  };
}
__name(run2, "run");

// src/workflows/automation/content_repurpose.js
var content_repurpose_exports = {};
__export(content_repurpose_exports, {
  run: () => run3
});
async function run3({ prompt, context }) {
  return {
    message: "Content repurposed (mock)",
    prompt,
    target: "Repurposed Content (e.g., LinkedIn, Blog)"
  };
}
__name(run3, "run");

// src/workflows/automation/reschedule_meeting.js
var reschedule_meeting_exports = {};
__export(reschedule_meeting_exports, {
  run: () => run4
});
async function run4({ prompt, context }) {
  return {
    message: "Meeting rescheduled (mock)",
    prompt,
    target: "Calendar/Meeting App (or elsewhere)"
  };
}
__name(run4, "run");

// src/workflows/automation/daily_intent_digest.js
var daily_intent_digest_exports = {};
__export(daily_intent_digest_exports, {
  run: () => run5
});
async function run5({ prompt, context }) {
  return {
    message: "Daily digest generated (mock)",
    prompt,
    target: "Digest/Notification (or elsewhere)"
  };
}
__name(run5, "run");

// src/workflows/automation/auto_tagging.js
var auto_tagging_exports = {};
__export(auto_tagging_exports, {
  run: () => run6
});
async function run6({ prompt, context }) {
  return {
    message: "Auto-tagging completed (mock)",
    prompt
  };
}
__name(run6, "run");

// src/workflows/automation/auto_reply.js
var auto_reply_exports = {};
__export(auto_reply_exports, {
  run: () => run7
});
async function run7({ prompt, context }) {
  return {
    message: "Auto-reply sent (mock)",
    prompt
  };
}
__name(run7, "run");

// src/workflow-engine.js
var workflows = {
  voice_to_anywhere: voice_to_anywhere_exports,
  attach_image_to_any_post: attach_image_to_any_post_exports,
  content_repurpose: content_repurpose_exports,
  reschedule_meeting: reschedule_meeting_exports,
  daily_intent_digest: daily_intent_digest_exports,
  auto_tagging: auto_tagging_exports,
  auto_reply: auto_reply_exports
};
async function runWorkflow(intent, prompt, context = {}) {
  const workflow = workflows[intent];
  if (!workflow || !workflow.run) {
    logger_default.error(`No workflow found for intent: ${intent}`);
    return {
      success: false,
      message: `\u274C No workflow found for intent: ${intent}`
    };
  }
  try {
    logger_default.info(`Running workflow for intent: ${intent}`);
    const result = await workflow.run({ prompt, context });
    return {
      success: true,
      intent,
      prompt,
      result
    };
  } catch (err) {
    logger_default.error(`Error running workflow for intent ${intent}:`, err);
    return {
      success: false,
      message: `\u274C Error running workflow: ${err.message}`
    };
  }
}
__name(runWorkflow, "runWorkflow");

// configs/prompt-router.json
var prompt_router_default = {
  _meta: {
    description: "Prompt routing configuration for AI agent. Map user prompt types or intents to specific workflows or response strategies."
  },
  routes: [
    {
      intent: "voice_to_anywhere",
      workflow: "voice_to_anywhere"
    },
    {
      intent: "attach_image",
      workflow: "attach_image_to_any_post"
    },
    {
      intent: "repurpose_content",
      workflow: "content_repurpose"
    },
    {
      intent: "reschedule_meeting",
      workflow: "reschedule_meeting"
    },
    {
      intent: "daily_digest",
      workflow: "daily_intent_digest"
    }
  ]
};

// src/utils/getIntentFromPrompt.js
function getIntentFromPrompt(prompt) {
  const lowered = prompt.toLowerCase();
  if (prompt.includes("\uC815\uB9AC") || prompt.includes("\uC694\uC57D") || lowered.includes("summarize") || lowered.includes("summary")) {
    return "daily_intent_digest";
  }
  if (prompt.includes("\uC774\uBBF8\uC9C0") && prompt.includes("\uBD99\uC5EC") || lowered.includes("image") && (lowered.includes("attach") || lowered.includes("add"))) {
    return "attach_image_to_any_post";
  }
  if (prompt.includes("\uD68C\uC758") && prompt.includes("\uBCC0\uACBD") || lowered.includes("meeting") && (lowered.includes("reschedule") || lowered.includes("change"))) {
    return "reschedule_meeting";
  }
  if (prompt.includes("\uAE30\uB85D") || prompt.includes("\uC544\uC774\uB514\uC5B4") || prompt.includes("\uC74C\uC131") || lowered.includes("record") || lowered.includes("idea") || lowered.includes("voice")) {
    return "voice_to_anywhere";
  }
  return null;
}
__name(getIntentFromPrompt, "getIntentFromPrompt");

// src/utils/oauth.js
var STATE_PREFIX = "oauth_state_";
var USER_PREFIX = "oauth_user_";
var STATE_EXPIRY = 60 * 5;
async function kvJSON(operation, env, key, value = null, options = {}) {
  switch (operation) {
    case "get":
      const data = await env.USERS_KV.get(key);
      return data ? JSON.parse(data) : null;
    case "put":
      await env.USERS_KV.put(key, JSON.stringify(value), options);
      return true;
    default:
      throw new Error(`Unknown KV operation: ${operation}`);
  }
}
__name(kvJSON, "kvJSON");
async function saveOAuthState(state, env) {
  const key = `${STATE_PREFIX}${state}`;
  return kvJSON("put", env, key, {
    created: Date.now()
  }, {
    expirationTtl: STATE_EXPIRY
  });
}
__name(saveOAuthState, "saveOAuthState");
async function verifyOAuthState(state, env) {
  if (!state) return false;
  const key = `${STATE_PREFIX}${state}`;
  try {
    const stored = await env.USERS_KV.getWithMetadata(key);
    if (!stored.value) return false;
    await env.USERS_KV.delete(key);
    return true;
  } catch (error) {
    console.error("Error during atomic state verification:", error);
    return false;
  }
}
__name(verifyOAuthState, "verifyOAuthState");
async function saveUserOAuthData(userId, data, env) {
  const key = `${USER_PREFIX}${userId}`;
  return kvJSON("put", env, key, {
    ...data,
    updated: Date.now()
  });
}
__name(saveUserOAuthData, "saveUserOAuthData");
function createOAuthErrorResponse(message, status = 400) {
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
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}
__name(createOAuthErrorResponse, "createOAuthErrorResponse");
function createOAuthSuccessResponse(message = "Authentication successful!") {
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
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}
__name(createOAuthSuccessResponse, "createOAuthSuccessResponse");

// src/oauth/google.js
async function handleGoogleOAuthRequest(request, env, responseHeaders = {}) {
  const headers = request.headers;
  const userAgent = headers.get("User-Agent") || "";
  const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
  const referer = headers.get("Referer") || "";
  const clientIp = headers.get("CF-Connecting-IP") || "";
  const meta = {
    requestId,
    clientIp,
    userAgent,
    referer
  };
  if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
    logger_default.warn("Loop detected in Google OAuth request", {
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
  const depth = Number(headers.get("X-Depth") || "0");
  if (depth > 3) {
    logger_default.warn("Request depth exceeded in Google OAuth", {
      ...meta,
      depth,
      reason: "depth_exceeded"
    });
    return new Response("Request depth limit exceeded", {
      status: 400,
      headers: { "X-Error-Type": "depth_exceeded" }
    });
  }
  logger_default.apiRequest("GET", "/oauth/google", meta);
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    logger_default.error("Google OAuth client ID is not configured", meta);
    return createOAuthErrorResponse("Google OAuth client ID is not configured", 500);
  }
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/google/callback`;
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email");
  const state = crypto.randomUUID();
  await saveOAuthState(state, env);
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
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
      "Content-Type": "text/html;charset=UTF-8",
      ...responseHeaders
    }
  });
}
__name(handleGoogleOAuthRequest, "handleGoogleOAuthRequest");
async function handleGoogleOAuthCallback(request, env, responseHeaders = {}) {
  const headers = request.headers;
  const userAgent = headers.get("User-Agent") || "";
  const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
  const referer = headers.get("Referer") || "";
  const clientIp = headers.get("CF-Connecting-IP") || "";
  const meta = {
    requestId,
    clientIp,
    userAgent,
    referer
  };
  if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
    logger_default.warn("Loop detected in Google OAuth callback", {
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
  const depth = Number(headers.get("X-Depth") || "0");
  if (depth > 3) {
    logger_default.warn("Request depth exceeded in Google OAuth callback", {
      ...meta,
      depth,
      reason: "depth_exceeded"
    });
    return new Response("Request depth limit exceeded", {
      status: 400,
      headers: { "X-Error-Type": "depth_exceeded" }
    });
  }
  logger_default.apiRequest("GET", "/oauth/google/callback", meta);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) {
    logger_default.error(`[OAuth Error] ${requestId} Google error: ${error}`, meta);
    return createOAuthErrorResponse(`Authentication Error: ${error}`);
  }
  if (!code) {
    logger_default.warn(`[OAuth Error] ${requestId} Missing code`, meta);
    return createOAuthErrorResponse("Authorization code is missing");
  }
  const isValidState = await verifyOAuthState(state, env);
  if (!isValidState) {
    logger_default.warn(`[OAuth Error] ${requestId} Invalid state`, meta);
    return createOAuthErrorResponse("Invalid state parameter");
  }
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/google/callback`;
  try {
    let tokenData;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Aivelle-OAuth-Client/1.0"
          },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
          })
        });
        if (!tokenRes.ok) {
          const errorData = await tokenRes.text();
          throw new Error(`Token exchange failed: ${errorData}`);
        }
        tokenData = await tokenRes.json();
        break;
      } catch (error2) {
        if (attempt === 3) throw error2;
        await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
      }
    }
    let userInfo;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "User-Agent": "Aivelle-OAuth-Client/1.0"
          }
        });
        if (!userInfoRes.ok) {
          throw new Error(`Failed to fetch user info: ${userInfoRes.status}`);
        }
        userInfo = await userInfoRes.json();
        break;
      } catch (error2) {
        if (attempt === 3) throw error2;
        await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
      }
    }
    const userId = userInfo.email || userInfo.id;
    let saveAttempt = 0;
    while (saveAttempt < 3) {
      try {
        await saveUserOAuthData(userId, {
          provider: "google",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
          email: userInfo.email,
          last_auth: (/* @__PURE__ */ new Date()).toISOString()
        }, env);
        break;
      } catch (error2) {
        saveAttempt++;
        if (saveAttempt === 3) throw error2;
        await new Promise((resolve) => setTimeout(resolve, 1e3 * saveAttempt));
      }
    }
    logger_default.info(`[OAuth Success] ${requestId} User ${userId} authenticated`, {
      ...meta,
      user_id: userId,
      email: userInfo.email
    });
    const response = createOAuthSuccessResponse("Successfully authenticated with Google!");
    response.headers = new Headers({
      ...response.headers,
      ...responseHeaders
    });
    return response;
  } catch (error2) {
    logger_default.error(`[OAuth Error] ${requestId} Authentication failed: ${error2.message}`, {
      ...meta,
      error: error2.message,
      stack: error2.stack
    });
    return createOAuthErrorResponse(`Authentication failed: ${error2.message}`, 500);
  }
}
__name(handleGoogleOAuthCallback, "handleGoogleOAuthCallback");

// src/oauth/notion.js
async function handleNotionOAuthRequest(request, env, responseHeaders = {}) {
  const headers = request.headers;
  const userAgent = headers.get("User-Agent") || "";
  const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
  const referer = headers.get("Referer") || "";
  const clientIp = headers.get("CF-Connecting-IP") || "";
  const meta = {
    requestId,
    clientIp,
    userAgent,
    referer
  };
  if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
    logger_default.warn("Loop detected in Notion OAuth request", {
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
  const depth = Number(headers.get("X-Depth") || "0");
  if (depth > 3) {
    logger_default.warn("Request depth exceeded in Notion OAuth", {
      ...meta,
      depth,
      reason: "depth_exceeded"
    });
    return new Response("Request depth limit exceeded", {
      status: 400,
      headers: { "X-Error-Type": "depth_exceeded" }
    });
  }
  logger_default.apiRequest("GET", "/oauth/notion", meta);
  const clientId = env.NOTION_CLIENT_ID;
  if (!clientId) {
    logger_default.error("Notion OAuth client ID is not configured", meta);
    return createOAuthErrorResponse("Notion OAuth client ID is not configured", 500);
  }
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/notion/callback`;
  const state = crypto.randomUUID();
  await saveOAuthState(state, env);
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&owner=user&state=${state}`;
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
      "Content-Type": "text/html;charset=UTF-8",
      ...responseHeaders
    }
  });
}
__name(handleNotionOAuthRequest, "handleNotionOAuthRequest");
async function handleNotionOAuthCallback(request, env, responseHeaders = {}) {
  const headers = request.headers;
  const userAgent = headers.get("User-Agent") || "";
  const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
  const referer = headers.get("Referer") || "";
  const clientIp = headers.get("CF-Connecting-IP") || "";
  const meta = {
    requestId,
    clientIp,
    userAgent,
    referer
  };
  if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
    logger_default.warn("Loop detected in Notion OAuth callback", {
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
  const depth = Number(headers.get("X-Depth") || "0");
  if (depth > 3) {
    logger_default.warn("Request depth exceeded in Notion OAuth callback", {
      ...meta,
      depth,
      reason: "depth_exceeded"
    });
    return new Response("Request depth limit exceeded", {
      status: 400,
      headers: { "X-Error-Type": "depth_exceeded" }
    });
  }
  logger_default.apiRequest("GET", "/oauth/notion/callback", meta);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) {
    logger_default.error(`[OAuth Error] ${requestId} Notion error: ${error}`, meta);
    return createOAuthErrorResponse(`Authentication Error: ${error}`);
  }
  if (!code) {
    logger_default.warn(`[OAuth Error] ${requestId} Missing code`, meta);
    return createOAuthErrorResponse("Authorization code is missing");
  }
  const isValidState = await verifyOAuthState(state, env);
  if (!isValidState) {
    logger_default.warn(`[OAuth Error] ${requestId} Invalid state`, meta);
    return createOAuthErrorResponse("Invalid state parameter");
  }
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/notion/callback`;
  try {
    let tokenData;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`)}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
            "User-Agent": "Aivelle-OAuth-Client/1.0"
          },
          body: JSON.stringify({
            grant_type: "authorization_code",
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
      } catch (error2) {
        if (attempt === 3) throw error2;
        await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
      }
    }
    const workspaceId = tokenData.workspace_id;
    const botId = tokenData.bot_id;
    const accessToken = tokenData.access_token;
    let saveAttempt = 0;
    while (saveAttempt < 3) {
      try {
        await saveUserOAuthData(workspaceId, {
          provider: "notion",
          access_token: accessToken,
          bot_id: botId,
          workspace_id: workspaceId,
          owner: tokenData.owner,
          workspace_name: tokenData.workspace_name,
          workspace_icon: tokenData.workspace_icon,
          last_auth: (/* @__PURE__ */ new Date()).toISOString()
        }, env);
        break;
      } catch (error2) {
        saveAttempt++;
        if (saveAttempt === 3) throw error2;
        await new Promise((resolve) => setTimeout(resolve, 1e3 * saveAttempt));
      }
    }
    logger_default.info(`[OAuth Success] ${requestId} Workspace ${workspaceId} authenticated`, {
      ...meta,
      workspace_id: workspaceId
    });
    const response = createOAuthSuccessResponse("Successfully authenticated with Notion!");
    response.headers = new Headers({
      ...response.headers,
      ...responseHeaders
    });
    return response;
  } catch (error2) {
    logger_default.error(`[OAuth Error] ${requestId} Authentication failed: ${error2.message}`, {
      ...meta,
      error: error2.message,
      stack: error2.stack
    });
    return createOAuthErrorResponse(`Authentication failed: ${error2.message}`, 500);
  }
}
__name(handleNotionOAuthCallback, "handleNotionOAuthCallback");

// src/index.js
var src_default = {
  async fetch(request, env) {
    const headers = request.headers;
    const userAgent = headers.get("User-Agent") || "";
    const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
    const referer = headers.get("Referer") || "";
    const clientIp = request.headers.get("CF-Connecting-IP") || "";
    const meta = {
      requestId,
      clientIp,
      userAgent,
      referer
    };
    if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
      logger_default.warn("Loop detected and blocked", {
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
    const depth = Number(headers.get("X-Depth") || "0");
    if (depth > 3) {
      logger_default.warn("Request depth limit exceeded", {
        ...meta,
        depth,
        reason: "depth_exceeded"
      });
      return new Response("Request depth limit exceeded", {
        status: 400,
        headers: { "X-Error-Type": "depth_exceeded" }
      });
    }
    logger_default.apiRequest(request.method, new URL(request.url).pathname, meta);
    const responseHeaders = {
      "X-Request-ID": requestId,
      "X-Depth": (depth + 1).toString(),
      "X-Processor": "aivelle-worker"
    };
    const url = new URL(request.url);
    const pathname = url.pathname;
    try {
      if (pathname === "/oauth/google") {
        return await handleGoogleOAuthRequest(request, env, responseHeaders);
      }
      if (pathname === "/oauth/google/callback") {
        return await handleGoogleOAuthCallback(request, env, responseHeaders);
      }
      if (pathname === "/oauth/notion") {
        return await handleNotionOAuthRequest(request, env, responseHeaders);
      }
      if (pathname === "/oauth/notion/callback") {
        return await handleNotionOAuthCallback(request, env, responseHeaders);
      }
      if (pathname === "/api/route-workflow" && request.method === "POST") {
        try {
          const body = await request.json();
          const intent = body.intent;
          const route = prompt_router_default.routes.find((r) => r.intent === intent);
          if (!route) {
            logger_default.warn("No workflow mapped for intent", {
              ...meta,
              intent,
              reason: "workflow_not_found"
            });
            return new Response(`\u274C No workflow mapped for intent: ${intent}`, {
              status: 404,
              headers: responseHeaders
            });
          }
          const workflow = workflows[route.workflow];
          if (!workflow) {
            logger_default.warn("Workflow not found", {
              ...meta,
              workflow: route.workflow,
              reason: "workflow_not_found"
            });
            return new Response(`\u274C Workflow not found: ${route.workflow}`, {
              status: 404,
              headers: responseHeaders
            });
          }
          const context = body.context || {};
          const startTime = performance.now();
          await runWorkflow(workflow, workflow.trigger, context);
          const endTime = performance.now();
          logger_default.logMetric("workflow_execution_time", endTime - startTime, {
            ...meta,
            workflow: route.workflow
          });
          return new Response(`Workflow '${route.workflow}' executed for intent '${intent}'.`, {
            status: 200,
            headers: responseHeaders
          });
        } catch (err) {
          logger_default.error("Workflow execution error", {
            ...meta,
            error: err.message,
            stack: err.stack
          });
          return new Response(`\u274C Error: ${err.message}`, {
            status: 500,
            headers: responseHeaders
          });
        }
      }
      if (pathname === "/" && request.method === "POST") {
        try {
          const body = await request.json();
          const prompt = body.prompt || "";
          const intent = getIntentFromPrompt(prompt);
          if (!intent) {
            logger_default.warn("No matching intent found", {
              ...meta,
              prompt,
              reason: "intent_not_found"
            });
            return new Response("\u274C No matching intent found.", {
              status: 400,
              headers: responseHeaders
            });
          }
          const startTime = performance.now();
          const result = await runWorkflow(intent, prompt);
          const endTime = performance.now();
          logger_default.logMetric("intent_execution_time", endTime - startTime, {
            ...meta,
            intent
          });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              ...responseHeaders,
              "Content-Type": "application/json"
            }
          });
        } catch (err) {
          logger_default.error("Root path execution error", {
            ...meta,
            error: err.message,
            stack: err.stack
          });
          return new Response(`\u274C Error: ${err.message}`, {
            status: 500,
            headers: responseHeaders
          });
        }
      }
      logger_default.warn("Route not found", {
        ...meta,
        path: pathname,
        reason: "route_not_found"
      });
      return new Response("Not Found", {
        status: 404,
        headers: responseHeaders
      });
    } catch (err) {
      logger_default.fatal("Unhandled error", {
        ...meta,
        error: err.message,
        stack: err.stack
      });
      return new Response("Internal Server Error", {
        status: 500,
        headers: responseHeaders
      });
    }
  }
};
addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request, event.env).catch((err) => {
      logger_default.fatal("Unhandled request error", {
        error: err.message,
        stack: err.stack
      });
      return new Response("Internal Server Error", { status: 500 });
    })
  );
});

// ../../../../usr/local/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-IjqVcK/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../usr/local/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-IjqVcK/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
