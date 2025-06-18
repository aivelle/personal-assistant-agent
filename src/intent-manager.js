import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };

/**
 * (Deprecated) Analyzes a user's prompt and returns the matched intent route using config-based keywords.
 * @param {string} prompt - The user input
 * @returns {string|null} - The route name if matched, else null
 */
// export function getIntentFromPrompt(prompt) {
//   const lowerPrompt = prompt.toLowerCase();
//
//   for (const route of promptRouter.routes) {
//     if (route.prompt_keywords) {
//       for (const keyword of route.prompt_keywords) {
//         if (lowerPrompt.includes(keyword)) {
//           return route.intent;
//         }
//       }
//     }
//   }
//
//   return null; // No match
// }

/**
 * Maps a user prompt to an intent using hardcoded keyword rules.
 * @param {string} prompt - The user input
 * @returns {string|null} - The intent name if matched, else null
 */
export function getIntentFromPrompt(prompt) {
  const lowered = prompt.toLowerCase();
  if (lowered.includes("summarize") || lowered.includes("summary")) {
    return "daily_intent_digest";
  }
  if (lowered.includes("image") && (lowered.includes("attach") || lowered.includes("add"))) {
    return "attach_image_to_any_post";
  }
  if (lowered.includes("meeting") && (lowered.includes("reschedule") || lowered.includes("change"))) {
    return "reschedule_meeting";
  }
  if (lowered.includes("record") || lowered.includes("idea") || lowered.includes("voice")) {
    return "voice_to_anywhere";
  }
  return null;
} 