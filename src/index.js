// src/index.js

import { workflows, runWorkflow } from "./workflow-engine.js";
import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };
import { runWorkflowFromPrompt } from "./run-workflow.js";
import { getIntentFromPrompt } from "./utils/getIntentFromPrompt.js";
import { handleGoogleOAuthRequest, handleGoogleOAuthCallback } from './oauth/google.js';
import { handleNotionOAuthRequest, handleNotionOAuthCallback } from './oauth/notion.js';
import { handleGPTAction } from './gpt-actions/endpoints.js';
import { SessionManager } from './utils/session.js';
import { GoogleClient } from './integrations/google.js';
// import logger from './utils/console.js';

export default {
  async fetch(request, env) {
    // ✅ I: Input → 요청 메타데이터 체크
    const headers = request.headers;
    const userAgent = headers.get("User-Agent") || "";
    const requestId = headers.get("X-Request-ID") || crypto.randomUUID();
    const referer = headers.get("Referer") || "";
    const clientIp = request.headers.get("CF-Connecting-IP") || "";

    // 기본 메타데이터
    const meta = {
      requestId,
      clientIp,
      userAgent,
      referer
    };

    // 무한 루프 감지 및 차단
    if (referer.includes("aivelle.com") || userAgent.includes("Aivelle-Agent")) {
      console.warn("Loop detected and blocked", meta);
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
      console.warn("Request depth limit exceeded", { ...meta, depth });
      return new Response("Request depth limit exceeded", { 
        status: 400,
        headers: { "X-Error-Type": "depth_exceeded" }
      });
    }

    // ✅ L: Log & Launch → 요청 기록
    console.log("API Request:", request.method, new URL(request.url).pathname, meta);

    // Add tracking headers for subsequent requests
    const responseHeaders = {
      "X-Request-ID": requestId,
      "X-Depth": (depth + 1).toString(),
      "X-Processor": "aivelle-worker"
    };

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // GPT Actions routes - PRIORITY ROUTING
      if (pathname.startsWith('/gpt/')) {
        console.log('Processing GPT Action:', pathname);
        return await handleGPTAction(request, env, pathname);
      }

      // Authentication page
      if (pathname === '/auth') {
        console.log('Processing /auth route');
        
        // 환경 변수 검증
        const missingEnvVars = [];
        if (!env.GOOGLE_CLIENT_ID) missingEnvVars.push('GOOGLE_CLIENT_ID');
        if (!env.GOOGLE_CLIENT_SECRET) missingEnvVars.push('GOOGLE_CLIENT_SECRET');
        if (!env.NOTION_CLIENT_ID) missingEnvVars.push('NOTION_CLIENT_ID');
        if (!env.NOTION_CLIENT_SECRET) missingEnvVars.push('NOTION_CLIENT_SECRET');
        if (!env.USERS_KV) missingEnvVars.push('USERS_KV');

        if (missingEnvVars.length > 0) {
          console.error("Missing environment variables:", missingEnvVars);
          return new Response(`Configuration Error: Missing ${missingEnvVars.join(', ')}`, {
            status: 500,
            headers: {
              'Content-Type': 'text/plain',
              ...responseHeaders
            }
          });
        }

        console.log('All environment variables are present, returning HTML');
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIVELLE - Authentication</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
        }
        .auth-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .auth-button {
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: background-color 0.2s;
            text-decoration: none;
        }
        .google {
            background-color: #4285f4;
            color: white;
        }
        .google:hover {
            background-color: #3367d6;
        }
        .notion {
            background-color: #000000;
            color: white;
        }
        .notion:hover {
            background-color: #2f2f2f;
        }
        .error {
            color: #d32f2f;
            margin-bottom: 20px;
            padding: 12px;
            background-color: #ffebee;
            border-radius: 4px;
            display: none;
        }
        .info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .info h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .endpoint {
            background: #f5f5f5;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AIVELLE Authentication</h1>
        <div id="error" class="error"></div>
        
        <div class="info">
            <h3>🤖 GPT Actions Available</h3>
            <p>After authentication, these endpoints will be available for ChatGPT:</p>
            <div class="endpoint">GET /gpt/calendar/events</div>
            <div class="endpoint">GET /gpt/calendar/free-time</div>
            <div class="endpoint">POST /gpt/calendar/schedule</div>
            <div class="endpoint">GET /gpt/schedule/analyze</div>
        </div>
        
        <div class="auth-buttons">
            <a href="/auth/google" class="auth-button google" onclick="return handleAuth(event)">
                Sign in with Google
            </a>
            <a href="/auth/notion" class="auth-button notion" onclick="return handleAuth(event)">
                Sign in with Notion
            </a>
        </div>
    </div>
    <script>
    function handleAuth(event) {
        try {
            const button = event.currentTarget;
            const provider = button.classList.contains('google') ? 'Google' : 'Notion';
            const errorDiv = document.getElementById('error');
            
            // 기본 동작 허용
            return true;
        } catch (error) {
            const errorDiv = document.getElementById('error');
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Authentication error occurred. Please try again.';
            return false;
        }
    }
    </script>
</body>
</html>`;

          return new Response(html, {
            headers: {
              'Content-Type': 'text/html',
              ...responseHeaders
            }
          });
      }

      // OAuth routes
      if (pathname === '/auth/google') {
        return await handleGoogleOAuthRequest(request, env, responseHeaders);
      } 
      if (pathname === '/auth/google/callback') {
        return await handleGoogleOAuthCallback(request, env, responseHeaders);
      }
      if (pathname === '/auth/notion') {
        return await handleNotionOAuthRequest(request, env, responseHeaders);
      }
      if (pathname === '/auth/notion/callback') {
        return await handleNotionOAuthCallback(request, env, responseHeaders);
      }

      // Legacy OAuth routes (redirect to new paths)
      if (pathname === '/oauth/google') {
        return Response.redirect(new URL('/auth/google', request.url).href, 301);
      }
      if (pathname === '/oauth/google/callback') {
        return Response.redirect(new URL('/auth/google/callback', request.url).href, 301);
      }
      if (pathname === '/oauth/notion') {
        return Response.redirect(new URL('/auth/notion', request.url).href, 301);
      }
      if (pathname === '/oauth/notion/callback') {
        return Response.redirect(new URL('/auth/notion/callback', request.url).href, 301);
      }

      // API routes
      if (pathname === "/api/route-workflow" && request.method === "POST") {
        try {
          const body = await request.json();
          const intent = body.intent;
          const route = promptRouter.routes.find(r => r.intent === intent);
          if (!route) {
            console.warn("No workflow mapped for intent", {
              ...meta,
              intent,
              reason: "workflow_not_found"
            });
            return new Response(`❌ No workflow mapped for intent: ${intent}`, { 
              status: 404,
              headers: responseHeaders
            });
          }
          const workflow = workflows[route.workflow];
          if (!workflow) {
            console.warn("Workflow not found", {
              ...meta,
              workflow: route.workflow,
              reason: "workflow_not_found"
            });
            return new Response(`❌ Workflow not found: ${route.workflow}`, { 
              status: 404,
              headers: responseHeaders
            });
          }
          const context = body.context || {};
          
          // 워크플로우 실행 시간 측정
          const startTime = performance.now();
          await runWorkflow(workflow, workflow.trigger, context);
          const endTime = performance.now();
          
          console.logMetric("workflow_execution_time", endTime - startTime, {
            ...meta,
            workflow: route.workflow
          });

          return new Response(`Workflow '${route.workflow}' executed for intent '${intent}'.`, { 
            status: 200,
            headers: responseHeaders
          });
        } catch (err) {
          console.error("Workflow execution error", {
            ...meta,
            error: err.message,
            stack: err.stack
          });
          return new Response(`❌ Error: ${err.message}`, { 
            status: 500,
            headers: responseHeaders
          });
        }
      }

      // Handle POST requests to the root path
      if (pathname === "/" && request.method === "POST") {
        try {
          const body = await request.json();
          const prompt = body.prompt || "";
          const intent = getIntentFromPrompt(prompt);

          if (!intent) {
            console.warn("No matching intent found", {
              ...meta,
              prompt,
              reason: "intent_not_found"
            });
            return new Response("❌ No matching intent found.", { 
              status: 400,
              headers: responseHeaders
            });
          }

          const startTime = performance.now();
          const result = await runWorkflow(intent, prompt);
          const endTime = performance.now();

          console.logMetric("intent_execution_time", endTime - startTime, {
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
          console.error("Root path execution error", {
            ...meta,
            error: err.message,
            stack: err.stack
          });
          return new Response(`❌ Error: ${err.message}`, { 
            status: 500,
            headers: responseHeaders
          });
        }
      }

      // Default response for unmatched routes
      console.warn("Route not found", {
        ...meta,
        path: pathname,
        reason: "route_not_found"
      });
      return new Response("Not Found", { 
        status: 404,
        headers: responseHeaders
      });
    } catch (err) {
      console.fatal("Unhandled error", {
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

// Cloudflare Workers 스타일 라우팅
addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request, event.env).catch(err => {
      console.fatal("Unhandled request error", {
        error: err.message,
        stack: err.stack
      });
      return new Response("Internal Server Error", { status: 500 });
    })
  );
});
