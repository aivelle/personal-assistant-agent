// src/index.js

import { getDatabases, createNotionTask } from "./notion.js";
import { workflows, runWorkflow } from "./workflow-engine.js";
import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };
import { runWorkflowFromPrompt } from "./run-workflow.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Return all databases (e.g., /api/databases)
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

    // 2. Return a specific database (e.g., /api/databases/Idea%20Bank)
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

    // 3. Create a new Task in Notion
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

    // 4. Route workflow by intent using prompt-router.json
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
        // Extend context as needed for your use case
        const context = body.context || {};
        await runWorkflow(workflow, workflow.trigger, context);
        return new Response(`Workflow '${route.workflow}' executed for intent '${intent}'.`, { status: 200 });
      } catch (err) {
        return new Response(`❌ Error: ${err.message}`, { status: 500 });
      }
    }

    // 5. Default response
    return new Response("✅ Hello from Personal Assistant Agent!", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};

// Example: Run a workflow from a test prompt (for development/testing only)
const testPrompt = "can you record this idea for me?";
runWorkflowFromPrompt(testPrompt);
