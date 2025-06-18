// src/utils/getIntentFromPrompt.js
// Returns the intent name based on the user's prompt using hardcoded keyword rules.

/**
 * Maps a user prompt to an intent using hardcoded keyword rules (Korean and English keywords).
 * @param {string} prompt - The user input
 * @returns {string|null} - The intent name if matched, else null
 */
export function getIntentFromPrompt(prompt) {
  if (prompt.includes("정리") || prompt.includes("요약")) {
    return "daily_intent_digest";
  }
  if (prompt.includes("이미지") && prompt.includes("붙여")) {
    return "attach_image_to_any_post";
  }
  if (prompt.includes("회의") && prompt.includes("변경")) {
    return "reschedule_meeting";
  }
  if (
    prompt.includes("기록") ||
    prompt.includes("아이디어") ||
    prompt.toLowerCase().includes("voice")
  ) {
    return "voice_to_anywhere";
  }
  return null;
}

