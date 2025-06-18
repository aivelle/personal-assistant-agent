var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// configs/databases.js
var databases_default = {
  "users": {
    "user_id": {
      "databases": {
        "Idea Bank": {
          "database_id": "idea_bank_001",
          "notion_link": "https://www.notion.so/your_database_id_here",
          "purpose": "Stores and categorizes creative ideas",
          "property_mapping": {
            "Idea Title": "title",
            "Date Added": "created_time",
            "Status": "status",
            "Category": "area",
            "Idea Content": "idea_text"
          }
        },
        "Social Media Planner": {
          "database_id": "social_media_001",
          "notion_link": "https://www.notion.so/your_database_id_here",
          "purpose": "Plans and schedules social media content",
          "property_mapping": {
            "Post Title": "title",
            "Date": "created_date",
            "Platform": "platform",
            "Status": "status",
            "Visuals Needed": "visual_required",
            "Scheduled Time": "scheduled_time",
            "Attachment": "media_attachment"
          }
        },
        "Projects": {
          "database_id": "projects_001",
          "notion_link": "https://www.notion.so/your_database_id_here",
          "purpose": "Tracks project progress and related tasks",
          "property_mapping": {
            "Project Title": "title",
            "Status": "status",
            "Owner": "owner",
            "Date Range": "date_range",
            "Priority": "priority",
            "Completion % (Auto)": "completion_rollup"
          }
        },
        "Tasks": {
          "database_id": "tasks_001",
          "notion_link": "https://www.notion.so/your_database_id_here",
          "purpose": "Manages actionable tasks linked to projects",
          "property_mapping": {
            "Task Title": "title",
            "Status": "status",
            "Due Date": "due_date",
            "Priority": "priority",
            "Category": "area",
            "Linked Project": "project_relation",
            "Completed On": "completed_on",
            "Delay (Auto)": "delay_formula"
          }
        },
        "Additional DB (Optional)": {
          "database_id": "custom_db_001",
          "notion_link": "https://www.notion.so/your_database_id_here",
          "purpose": "User-defined additional database",
          "property_mapping": {
            "Custom Title": "title",
            "Custom Content": "content"
          }
        }
      }
    }
  }
};

// src/notion.js
function getDatabases(userId = "user_id") {
  if (!databases_default.users[userId] || !databases_default.users[userId].databases) {
    throw new Error(`No databases found for user: ${userId}`);
  }
  return databases_default.users[userId].databases;
}
__name(getDatabases, "getDatabases");
for (const [dbName, dbObj] of Object.entries(getDatabases())) {
  console.log(`[${dbName}] - ID: ${dbObj.database_id}`);
}
async function createNotionTask(properties, notionToken) {
  const databaseId = getDatabases("user_id")["Tasks"].database_id;
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties
    })
  });
  if (!response.ok) {
    const error2 = await response.text();
    throw new Error(`Notion API error: ${error2}`);
  }
  return response.json();
}
__name(createNotionTask, "createNotionTask");

// src/utils/logger.js
function log(...args) {
  console.log("[LOG]", ...args);
}
__name(log, "log");
function error(...args) {
  console.error("[ERROR]", ...args);
}
__name(error, "error");

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
    error(`No workflow found for intent: ${intent}`);
    return {
      success: false,
      message: `\u274C No workflow found for intent: ${intent}`
    };
  }
  try {
    log(`Running workflow for intent: ${intent}`);
    const result = await workflow.run({ prompt, context });
    return {
      success: true,
      intent,
      prompt,
      result
    };
  } catch (err) {
    error(`Error running workflow for intent ${intent}:`, err);
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
var STATE_EXPIRY = 60 * 5;
async function saveOAuthState(state, env) {
  const key = `${STATE_PREFIX}${state}`;
  await env.USERS_KV.put(key, JSON.stringify({
    created: Date.now()
  }), {
    expirationTtl: STATE_EXPIRY
  });
}
__name(saveOAuthState, "saveOAuthState");
async function verifyOAuthState(state, env) {
  if (!state) return false;
  const key = `${STATE_PREFIX}${state}`;
  const stored = await env.USERS_KV.get(key);
  if (!stored) return false;
  await env.USERS_KV.delete(key);
  return true;
}
__name(verifyOAuthState, "verifyOAuthState");
async function saveUserOAuthData(userId, data, env) {
  const key = `oauth_user_${userId}`;
  await env.USERS_KV.put(key, JSON.stringify({
    ...data,
    updated: Date.now()
  }));
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
async function handleGoogleOAuthRequest(request, env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
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
      "Content-Type": "text/html;charset=UTF-8"
    }
  });
}
__name(handleGoogleOAuthRequest, "handleGoogleOAuthRequest");
async function handleGoogleOAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error2 = url.searchParams.get("error");
  if (error2) {
    return createOAuthErrorResponse(`Authentication Error: ${error2}`);
  }
  if (!code) {
    return createOAuthErrorResponse("Authorization code is missing");
  }
  const isValidState = await verifyOAuthState(state, env);
  if (!isValidState) {
    return createOAuthErrorResponse("Invalid state parameter");
  }
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/oauth/google/callback`;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
    const tokenData = await tokenRes.json();
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });
    if (!userInfoRes.ok) {
      throw new Error("Failed to fetch user info");
    }
    const userInfo = await userInfoRes.json();
    const userId = userInfo.email || userInfo.id;
    await saveUserOAuthData(userId, {
      provider: "google",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      email: userInfo.email
    }, env);
    return createOAuthSuccessResponse("Successfully authenticated with Google!");
  } catch (error3) {
    return createOAuthErrorResponse(`Authentication failed: ${error3.message}`, 500);
  }
}
__name(handleGoogleOAuthCallback, "handleGoogleOAuthCallback");

// src/oauth/notion.js
async function handleNotionOAuthRequest(request) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = "https://yourdomain.com/oauth/notion/callback";
  const state = "random_state_string";
  const url = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
  return Response.redirect(url, 302);
}
__name(handleNotionOAuthRequest, "handleNotionOAuthRequest");
async function handleNotionOAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://yourdomain.com/oauth/notion/callback"
    }),
    auth: `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  });
  const tokenData = await tokenRes.json();
  const userId = tokenData.owner?.user?.id || tokenData.workspace_id || "notion_user";
  await saveUserOAuthData(userId, {
    provider: "notion",
    access_token: tokenData.access_token,
    workspace_id: tokenData.workspace_id,
    bot_id: tokenData.bot_id
  }, env);
  return Response.redirect("/onboarding/success", 302);
}
__name(handleNotionOAuthCallback, "handleNotionOAuthCallback");

// src/index.js
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (pathname === "/oauth/google") {
      return handleGoogleOAuthRequest(request, env);
    }
    if (pathname === "/oauth/google/callback") {
      return handleGoogleOAuthCallback(request, env);
    }
    if (pathname === "/oauth/notion") {
      return handleNotionOAuthRequest(request, env);
    }
    if (pathname === "/oauth/notion/callback") {
      return handleNotionOAuthCallback(request, env);
    }
    if (pathname === "/api/databases") {
      try {
        const databases = getDatabases("user_id");
        return new Response(JSON.stringify(databases, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(`\u274C Error: ${err.message}`, { status: 500 });
      }
    }
    if (pathname.startsWith("/api/databases/")) {
      const dbName = decodeURIComponent(pathname.replace("/api/databases/", ""));
      try {
        const databases = getDatabases("user_id");
        const db = databases[dbName];
        if (!db) {
          return new Response(`\u274C Database "${dbName}" not found`, { status: 404 });
        }
        return new Response(JSON.stringify(db, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(`\u274C Error: ${err.message}`, { status: 500 });
      }
    }
    if (pathname === "/api/create-task" && request.method === "POST") {
      try {
        const body = await request.json();
        const notionToken = env.NOTION_API_TOKEN;
        const result = await createNotionTask(body, notionToken);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(`\u274C Error: ${err.message}`, { status: 500 });
      }
    }
    if (pathname === "/api/route-workflow" && request.method === "POST") {
      try {
        const body = await request.json();
        const intent = body.intent;
        const route = prompt_router_default.routes.find((r) => r.intent === intent);
        if (!route) {
          return new Response(`\u274C No workflow mapped for intent: ${intent}`, { status: 404 });
        }
        const workflow = workflows[route.workflow];
        if (!workflow) {
          return new Response(`\u274C Workflow not found: ${route.workflow}`, { status: 404 });
        }
        const context = body.context || {};
        await runWorkflow(workflow, workflow.trigger, context);
        return new Response(`Workflow '${route.workflow}' executed for intent '${intent}'.`, { status: 200 });
      } catch (err) {
        return new Response(`\u274C Error: ${err.message}`, { status: 500 });
      }
    }
    if (pathname === "/" && request.method === "POST") {
      try {
        const body = await request.json();
        const prompt = body.prompt || "";
        const intent = getIntentFromPrompt(prompt);
        if (!intent) {
          return new Response("\u274C No matching intent found.", { status: 400 });
        }
        const result = await runWorkflow(intent, prompt);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(`\u274C Error: ${err.message}`, { status: 500 });
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};
addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === "/oauth/google") {
    event.respondWith(handleGoogleOAuthRequest(event.request, event.env));
  } else if (url.pathname === "/oauth/google/callback") {
    event.respondWith(handleGoogleOAuthCallback(event.request, event.env));
  } else if (url.pathname === "/oauth/notion") {
    event.respondWith(handleNotionOAuthRequest(event.request, event.env));
  } else if (url.pathname === "/oauth/notion/callback") {
    event.respondWith(handleNotionOAuthCallback(event.request, event.env));
  } else {
  }
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
