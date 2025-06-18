// src/workflow-engine.js

import { log, error as logError } from "./utils/logger.js";
import * as voiceToAnywhere from "./workflows/voice_to_anywhere.js";
import * as attachImageToAnyPost from "./workflows/attach_image_to_any_post.js";
import * as contentRepurpose from "./workflows/content_repurpose.js";
import * as rescheduleMeeting from "./workflows/reschedule_meeting.js";
import * as dailyIntentDigest from "./workflows/daily_intent_digest.js";
// TODO: Support dynamic import for new workflows (e.g., import.meta.glob or build script)

const workflows = {
  voice_to_anywhere: voiceToAnywhere,
  attach_image_to_any_post: attachImageToAnyPost,
  content_repurpose: contentRepurpose,
  reschedule_meeting: rescheduleMeeting,
  daily_intent_digest: dailyIntentDigest,
};

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