// src/utils/getIntentFromPrompt.js
// Returns the intent name based on the user's prompt using hardcoded keyword rules.

/**
 * Maps a user prompt to an intent using hardcoded keyword rules (English keywords only).
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
  if (
    lowered.includes("record") ||
    lowered.includes("idea") ||
    lowered.includes("voice")
  ) {
    return "voice_to_anywhere";
  }
  return null;
}

