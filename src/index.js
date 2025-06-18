// src/index.js

import { getDatabases, createNotionTask } from "./notion.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Return all databases (ex. /api/databases)
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

    // 2. Return a specific database (ex. /api/databases/Idea%20Bank)
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

    // 4. Default response
    return new Response("✅ Hello from Personal Assistant Agent!", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
