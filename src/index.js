// src/index.js

import { getDatabases, createNotionTask } from "./notion.js";
import { workflows, runWorkflow } from "./workflow-engine.js";
import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };
import { runWorkflowFromPrompt } from "./run-workflow.js";
import { getIntentFromPrompt } from "./utils/getIntentFromPrompt.js";
import { handleGoogleOAuthRequest, handleGoogleOAuthCallback } from './oauth/google.js';
import { handleNotionOAuthRequest, handleNotionOAuthCallback } from './oauth/notion.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // OAuth routes
    if (pathname === '/oauth/google') {
      return handleGoogleOAuthRequest(request, env);
    } 
    if (pathname === '/oauth/google/callback') {
      return handleGoogleOAuthCallback(request, env);
    } 
    if (pathname === '/oauth/notion') {
      return handleNotionOAuthRequest(request, env);
    } 
    if (pathname === '/oauth/notion/callback') {
      return handleNotionOAuthCallback(request, env);
    }

    // API routes
    if (pathname === "/api/databases") {
      try {
        const databases = getDatabases("user_id");
        return new Response(JSON.stringify(databases, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(`❌ Error: ${err.message}`, { status: 500 });
      }
    }

    if (pathname.startsWith("/api/databases/")) {
      const dbName = decodeURIComponent(pathname.replace("/api/databases/", ""));
      try {
        const databases = getDatabases("user_id");
        const db = databases[dbName];
        if (!db) {
          return new Response(`❌ Database \"${dbName}\" not found`, { status: 404 });
        }
        return new Response(JSON.stringify(db, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(`❌ Error: ${err.message}`, { status: 500 });
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
        return new Response(`❌ Error: ${err.message}`, { status: 500 });
      }
    }

    if (pathname === "/api/route-workflow" && request.method === "POST") {
      try {
        const body = await request.json();
        const intent = body.intent;
        const route = promptRouter.routes.find(r => r.intent === intent);
        if (!route) {
          return new Response(`❌ No workflow mapped for intent: ${intent}`, { status: 404 });
        }
        const workflow = workflows[route.workflow];
        if (!workflow) {
          return new Response(`❌ Workflow not found: ${route.workflow}`, { status: 404 });
        }
        const context = body.context || {};
        await runWorkflow(workflow, workflow.trigger, context);
        return new Response(`Workflow '${route.workflow}' executed for intent '${intent}'.`, { status: 200 });
      } catch (err) {
        return new Response(`❌ Error: ${err.message}`, { status: 500 });
      }
    }

    // Handle POST requests to the root path
    if (pathname === "/" && request.method === "POST") {
      try {
        const body = await request.json();
        const prompt = body.prompt || "";
        const intent = getIntentFromPrompt(prompt);

        if (!intent) {
          return new Response("❌ No matching intent found.", { status: 400 });
        }

        const result = await runWorkflow(intent, prompt);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(`❌ Error: ${err.message}`, { status: 500 });
      }
    }

    // Default response for unmatched routes
    return new Response("Not Found", { status: 404 });
  }
};

// Example: Run a workflow from a test prompt (for development/testing only)
// const testPrompt = "can you record this idea for me?";
// runWorkflowFromPrompt(testPrompt);

// 예시: Cloudflare Workers 스타일 라우팅
addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/oauth/google') {
    event.respondWith(handleGoogleOAuthRequest(event.request, event.env));
  } else if (url.pathname === '/oauth/google/callback') {
    event.respondWith(handleGoogleOAuthCallback(event.request, event.env));
  } else if (url.pathname === '/oauth/notion') {
    event.respondWith(handleNotionOAuthRequest(event.request, event.env));
  } else if (url.pathname === '/oauth/notion/callback') {
    event.respondWith(handleNotionOAuthCallback(event.request, event.env));
  } else {
    // ... 기존 라우팅 ...
  }
});
