// src/utils/getIntentFromPrompt.js
// Returns the intent name based on the user's prompt using hardcoded keyword rules (Korean + English)

/**
 * Maps a user prompt to an intent using hardcoded keyword rules (Korean and English).
 * @param {string} prompt - The user input
 * @returns {string|null} - The intent name if matched, else null
 */
export function getIntentFromPrompt(prompt) {
  const lowered = prompt.toLowerCase();

  if (
    lowered.includes("summarize") ||
    lowered.includes("summary") ||
    prompt.includes("정리") ||
    prompt.includes("요약")
  ) {
    return "daily_intent_digest";
  }

  if (
    (lowered.includes("image") && (lowered.includes("attach") || lowered.includes("add"))) ||
    (prompt.includes("이미지") && prompt.includes("붙여"))
  ) {
    return "attach_image_to_any_post";
  }

  if (
    (lowered.includes("meeting") && (lowered.includes("reschedule") || lowered.includes("change"))) ||
    (prompt.includes("회의") && prompt.includes("변경"))
  ) {
    return "reschedule_meeting";
  }

  if (
    lowered.includes("record") ||
    lowered.includes("idea") ||
    lowered.includes("voice") ||
    prompt.includes("기록") ||
    prompt.includes("아이디어")
  ) {
    return "voice_to_anywhere";
  }

  return null;
}



