var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-klo90K/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

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
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  return response.json();
}
__name(createNotionTask, "createNotionTask");

// workflows/scenario/automation/voice-to-anywhere.json
var voice_to_anywhere_default = {
  workflow_id: "voice_to_anywhere",
  trigger: "on_voice_input",
  actions: [
    {
      type: "voice_to_text",
      input_var: "voice_data",
      output_var: "transcribed_text"
    },
    {
      type: "ask_user",
      prompt: "Where should I save this note? (note, task, message, etc)",
      output_var: "destination_type"
    },
    {
      type: "save_to",
      destination: "{{destination_type}}",
      content_var: "transcribed_text"
    }
  ]
};

// workflows/scenario/automation/attach-image-to-any-post.json
var attach_image_to_any_post_default = {
  workflow_id: "attach_image_to_any_post",
  trigger: "on_image_upload",
  actions: [
    {
      type: "ask_user",
      prompt: "Which post should this image be attached to?",
      output_var: "target_post_id"
    },
    {
      type: "attach_image",
      post_id: "{{target_post_id}}",
      image_url_var: "uploaded_image_url"
    }
  ]
};

// workflows/scenario/automation/content-repurpose.json
var content_repurpose_default = {
  workflow_id: "content_repurpose",
  trigger: "on_user_request",
  actions: [
    {
      type: "ask_user",
      prompt: "Which content do you want to repurpose?",
      output_var: "source_content_id"
    },
    {
      type: "ask_user",
      prompt: "What format do you want? (summary, tweet, email, etc)",
      output_var: "target_format"
    },
    {
      type: "ai_transform",
      content_id: "{{source_content_id}}",
      target_format: "{{target_format}}",
      output_var: "repurposed_content"
    },
    {
      type: "save_to",
      destination: "user_selected",
      content_var: "repurposed_content"
    }
  ]
};

// workflows/scenario/automation/reschedule-meeting.json
var reschedule_meeting_default = {
  workflow_id: "reschedule_meeting",
  trigger: "on_conflict_or_user_request",
  actions: [
    {
      type: "ask_user",
      prompt: "Which meeting do you want to reschedule?",
      output_var: "meeting_id"
    },
    {
      type: "detect_conflict",
      meeting_id: "{{meeting_id}}",
      output_var: "conflict_info"
    },
    {
      type: "suggest_alternatives",
      conflict_info: "{{conflict_info}}",
      output_var: "suggested_times"
    },
    {
      type: "ask_user",
      prompt: "Which new time would you like to select?",
      options_var: "suggested_times",
      output_var: "selected_time"
    },
    {
      type: "update_meeting",
      meeting_id: "{{meeting_id}}",
      new_time: "{{selected_time}}"
    }
  ]
};

// workflows/scenario/automation/daily-intent-digest.json
var daily_intent_digest_default = {
  workflow_id: "daily_intent_digest",
  trigger: "scheduled_nightly",
  actions: [
    {
      type: "gather_user_intents",
      period: "today",
      output_var: "intent_summary"
    },
    {
      type: "notion_create",
      database_id: "idea_bank_001",
      properties: {
        "Idea Title": "Daily Summary - {{today}}",
        Idea: "{{intent_summary}}"
      }
    }
  ]
};

// src/workflow-engine.js
var workflows = {
  "voice_to_anywhere": voice_to_anywhere_default,
  "attach_image_to_any_post": attach_image_to_any_post_default,
  "content_repurpose": content_repurpose_default,
  "reschedule_meeting": reschedule_meeting_default,
  "daily_intent_digest": daily_intent_digest_default
};
var actionHandlers = {
  voice_to_text: /* @__PURE__ */ __name(async (action, context) => {
    context.transcribed_text = await fakeVoiceToText(context.voice_data);
  }, "voice_to_text"),
  ask_user: /* @__PURE__ */ __name(async (action, context) => {
    context[action.output_var] = await fakeAskUser(action.prompt);
  }, "ask_user"),
  save_to: /* @__PURE__ */ __name(async (action, context) => {
    await fakeSaveTo(action.destination, context[action.content_var]);
  }, "save_to"),
  attach_image: /* @__PURE__ */ __name(async (action, context) => {
    await fakeAttachImage(action.post_id, context[action.image_url_var]);
  }, "attach_image"),
  ai_transform: /* @__PURE__ */ __name(async (action, context) => {
    context[action.output_var] = await fakeAITransform(
      context[action.content_id],
      context[action.target_format]
    );
  }, "ai_transform"),
  update_meeting: /* @__PURE__ */ __name(async (action, context) => {
    await fakeUpdateMeeting(action.meeting_id, action.new_time);
  }, "update_meeting")
  // ...다른 액션 타입도 추가
};
async function runWorkflow(workflow, triggerEvent, context = {}) {
  if (triggerEvent !== workflow.trigger) return;
  for (const action of workflow.actions) {
    const handler = actionHandlers[action.type];
    if (handler) {
      await handler(action, context);
    } else {
      console.warn(`No handler for action type: ${action.type}`);
    }
  }
}
__name(runWorkflow, "runWorkflow");
async function fakeVoiceToText(voiceData) {
  return "This is a transcribed note.";
}
__name(fakeVoiceToText, "fakeVoiceToText");
async function fakeAskUser(prompt) {
  console.log(prompt);
  return "note";
}
__name(fakeAskUser, "fakeAskUser");
async function fakeSaveTo(destination, content) {
  console.log(`Saving to ${destination}: ${content}`);
}
__name(fakeSaveTo, "fakeSaveTo");
async function fakeAttachImage(postId, imageUrl) {
  console.log(`Attaching image ${imageUrl} to post ${postId}`);
}
__name(fakeAttachImage, "fakeAttachImage");
async function fakeAITransform(contentId, targetFormat) {
  return `Transformed content ${contentId} to format ${targetFormat}`;
}
__name(fakeAITransform, "fakeAITransform");
async function fakeUpdateMeeting(meetingId, newTime) {
  console.log(`Updating meeting ${meetingId} to new time ${newTime}`);
}
__name(fakeUpdateMeeting, "fakeUpdateMeeting");

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

// src/intent-manager.js
function getIntentFromPrompt(prompt) {
  const lowered = prompt.toLowerCase();
  if (lowered.includes("record") || lowered.includes("voice") || lowered.includes("idea")) {
    return "voice_to_anywhere";
  }
  if (lowered.includes("image") || lowered.includes("attach") || lowered.includes("upload")) {
    return "attach_image";
  }
  if (lowered.includes("repurpose") || lowered.includes("reuse") || lowered.includes("turn this into") || lowered.includes("transform")) {
    return "repurpose_content";
  }
  if (lowered.includes("reschedule") || lowered.includes("change time") || lowered.includes("postpone") || lowered.includes("move meeting")) {
    return "reschedule_meeting";
  }
  if (lowered.includes("summary") || lowered.includes("digest") || lowered.includes("recap of today")) {
    return "daily_digest";
  }
  return null;
}
__name(getIntentFromPrompt, "getIntentFromPrompt");

// configs/workflow-router.json
var workflow_router_default = [
  {
    workflow_id: "voice_to_anywhere",
    endpoint: "/api/voice-to-anywhere"
  },
  {
    workflow_id: "attach_image_to_any_post",
    endpoint: "/api/attach-image-to-any-post"
  },
  {
    workflow_id: "reschedule_meeting",
    endpoint: "/api/reschedule-meeting"
  },
  {
    workflow_id: "content_repurpose",
    endpoint: "/api/content-repurpose"
  },
  {
    workflow_id: "daily_intent_digest",
    endpoint: "/api/daily-intent-digest"
  }
];

// src/run-workflow.js
function getEndpointFromRoute(route) {
  const routes = Array.isArray(workflow_router_default) ? workflow_router_default : workflow_router_default.routes;
  const match = routes.find((item) => item.workflow_id === route);
  return match ? match.endpoint : null;
}
__name(getEndpointFromRoute, "getEndpointFromRoute");
async function runWorkflowFromPrompt(prompt, context = {}) {
  const route = getIntentFromPrompt(prompt);
  if (!route) {
    console.error("\u274C No matching intent found.");
    return;
  }
  let endpoint = getEndpointFromRoute(route);
  if (!endpoint) {
    console.error(`\u274C No workflow endpoint found for route: ${route}`);
    return;
  }
  const baseUrl = "http://localhost:8787";
  if (endpoint.startsWith("/")) {
    endpoint = `${baseUrl}${endpoint}`;
  }
  const body = { user_prompt: prompt, ...context };
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const result = await response.text();
    console.log(`\u2705 Executed [${route}] \u2192`, result);
    return result;
  } catch (err) {
    console.error(`\u274C Failed to call endpoint: ${err.message}`);
    return null;
  }
}
__name(runWorkflowFromPrompt, "runWorkflowFromPrompt");
var testPrompt = "Can you record this idea for me?";
runWorkflowFromPrompt(testPrompt);

// src/index.js
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
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
    return new Response("\u2705 Hello from Personal Assistant Agent!", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
var testPrompt2 = "can you record this idea for me?";
runWorkflowFromPrompt(testPrompt2);

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

// ../../../../usr/local/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-klo90K/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
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

// .wrangler/tmp/bundle-klo90K/middleware-loader.entry.ts
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
