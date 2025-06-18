// src/workflow-engine.js

import { log, error as logError } from "./utils/logger.js";

// Dynamically import all workflow modules in src/workflows/*.js
const modules = import.meta.glob('./workflows/*.js', { eager: true });

const workflows = {};
for (const path in modules) {
  // Extract intent from filename (e.g., ./workflows/voice_to_anywhere.js → voice_to_anywhere)
  const match = path.match(/\.\/workflows\/(.+)\.js$/);
  if (match) {
    const intent = match[1];
    workflows[intent] = modules[path];
  }
}

/**
 * Runs the workflow for the given intent
 * @param {string} intent - The intent name
 * @param {string} prompt - The original user prompt
 * @param {object} [context={}] - Optional context
 * @returns {Promise<object>} - Result of the workflow
 */
export async function runWorkflow(intent, prompt, context = {}) {
  const workflow = workflows[intent];
  if (!workflow || !workflow.run) {
    logError(`No workflow found for intent: ${intent}`);
    return {
      success: false,
      message: `❌ No workflow found for intent: ${intent}`,
    };
  }

  try {
    log(`Running workflow for intent: ${intent}`);
    const result = await workflow.run({ prompt, context });
    return {
      success: true,
      intent,
      prompt,
      result,
    };
  } catch (err) {
    logError(`Error running workflow for intent ${intent}:`, err);
    return {
      success: false,
      message: `❌ Error running workflow: ${err.message}`,
    };
  }
}

export { workflows }; 