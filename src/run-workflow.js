import { workflows, runWorkflow } from "./workflow-engine.js";
import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };
import { getIntentFromPrompt } from "./utils/getIntentFromPrompt.js";

/**
 * Runs a workflow by intent or workflow name.
 * @param {string} key - intent or workflow name
 * @param {object} context - context object for the workflow
 * @returns {Promise<string>} - Result message
 */
export async function runWorkflowByKey(key, context = {}) {
  // Try to find by intent first
  let workflowName = key;
  const route = promptRouter.routes.find(r => r.intent === key || r.workflow === key);
  if (route) {
    workflowName = route.workflow;
  }
  const workflow = workflows[workflowName];
  if (!workflow) {
    throw new Error(`Workflow not found for key: ${key}`);
  }
  await runWorkflow(workflow, workflow.trigger, context);
  return `Workflow '${workflowName}' executed.`;
}

/**
 * Get endpoint from prompt-router using intent or workflow name
 * @param {string} route - The route name from intent-manager
 * @returns {string|null} - The endpoint string (full URL)
 */
function getEndpointFromRoute(route) {
  const routes = Array.isArray(promptRouter.routes) ? promptRouter.routes : promptRouter;
  const match = routes.find(item => item.workflow === route || item.intent === route);
  return match ? match.endpoint : null;
}

/**
 * Given a user prompt, automatically find and call the corresponding workflow endpoint
 * @param {string} prompt - The user's input
 * @param {object} [context={}] - Additional context to send to the workflow
 */
export async function runWorkflowFromPrompt(prompt, context = {}) {
  const route = getIntentFromPrompt(prompt);
  if (!route) {
    console.error("❌ No matching intent found.");
    return;
  }

  let endpoint = getEndpointFromRoute(route);
  if (!endpoint) {
    console.error(`❌ No workflow endpoint found for route: ${route}`);
    return;
  }

  // Environment-based endpoint prefixing
  const isDev = process.env.NODE_ENV !== "production";
  const baseUrl = isDev ? "http://localhost:8787" : "https://api.aivelle.com";
  if (!endpoint.startsWith("http")) {
    endpoint = `${baseUrl}${endpoint}`;
  }

  // Merge prompt and context for the request body
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
    console.log(`✅ Executed [${route}] →`, result);
    return result;
  } catch (err) {
    console.error(`❌ Failed to call endpoint: ${err.message}`);
    return null;
  }
}

// Example usage:
// runWorkflowFromPrompt('Please record a voice note', { user_id: 'user_id_123' });

// Example usage (for testing):
// runWorkflowByKey('voice_to_anywhere', { voice_data: 'sample' });

// const testPrompt = "Can you record this idea for me?";
// runWorkflowFromPrompt(testPrompt); 