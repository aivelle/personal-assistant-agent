// src/index.js

import { workflows, runWorkflow } from "./workflow-engine.js";
import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };
import { runWorkflowFromPrompt } from "./run-workflow.js";
import { getIntentFromPrompt } from "./utils/getIntentFromPrompt.js";
import { handleGoogleOAuthRequest, handleGoogleOAuthCallback } from './oauth/google.js';
import logger from './utils/logger.js';

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
      logger.warn("Loop detected and blocked", {
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
      logger.warn("Request depth limit exceeded", {
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
    logger.apiRequest(request.method, new URL(request.url).pathname, meta);

    // Add tracking headers for subsequent requests
    const responseHeaders = {
      "X-Request-ID": requestId,
      "X-Depth": (depth + 1).toString(),
      "X-Processor": "aivelle-worker"
    };

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // OAuth routes
      if (pathname === '/oauth/google') {
        return await handleGoogleOAuthRequest(request, env, responseHeaders);
      } 
      if (pathname === '/oauth/google/callback') {
        return await handleGoogleOAuthCallback(request, env, responseHeaders);
      }

      // API routes
      if (pathname === "/api/route-workflow" && request.method === "POST") {
        try {
          const body = await request.json();
          const intent = body.intent;
          const route = promptRouter.routes.find(r => r.intent === intent);
          if (!route) {
            logger.warn("No workflow mapped for intent", {
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
            logger.warn("Workflow not found", {
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
          
          logger.logMetric("workflow_execution_time", endTime - startTime, {
            ...meta,
            workflow: route.workflow
          });

          return new Response(`Workflow '${route.workflow}' executed for intent '${intent}'.`, { 
            status: 200,
            headers: responseHeaders
          });
        } catch (err) {
          logger.error("Workflow execution error", {
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
            logger.warn("No matching intent found", {
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

          logger.logMetric("intent_execution_time", endTime - startTime, {
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
          logger.error("Root path execution error", {
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
      logger.warn("Route not found", {
        ...meta,
        path: pathname,
        reason: "route_not_found"
      });
      return new Response("Not Found", { 
        status: 404,
        headers: responseHeaders
      });
    } catch (err) {
      logger.fatal("Unhandled error", {
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
      logger.fatal("Unhandled request error", {
        error: err.message,
        stack: err.stack
      });
      return new Response("Internal Server Error", { status: 500 });
    })
  );
});
