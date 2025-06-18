import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };

/**
 * Analyzes a user's prompt and returns the matched intent route
 * @param {string} prompt - The user input
 * @returns {string|null} - The route name if matched, else null
 */
export function getIntentFromPrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  for (const route of promptRouter.routes) {
    if (route.prompt_keywords) {
      for (const keyword of route.prompt_keywords) {
        if (lowerPrompt.includes(keyword)) {
          return route.intent;
        }
      }
    }
  }

  return null; // No match
}

/**
 * Maps a user prompt to an intent using hardcoded keyword rules.
 * @param {string} prompt - The user input
 * @returns {string|null} - The intent name if matched, else null
 */
export function detectIntentFromPrompt(prompt) {
  const lowered = prompt.toLowerCase();
  if (lowered.includes("record") || lowered.includes("voice") || lowered.includes("idea")) {
    return "voice_to_anywhere";
  }
  if (lowered.includes("attach") || lowered.includes("image")) {
    return "attach_image";
  }
  if (lowered.includes("repurpose") || lowered.includes("reuse")) {
    return "repurpose_content";
  }
  if (lowered.includes("reschedule") || lowered.includes("change meeting")) {
    return "reschedule_meeting";
  }
  if (lowered.includes("digest") || lowered.includes("summary of the day")) {
    return "daily_digest";
  }
  return null;
} 