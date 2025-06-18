// src/utils/getIntentFromPrompt.js
// Returns the intent name based on the user's prompt using hardcoded keyword rules (Korean + English)

/**
 * Maps a user prompt to an intent using hardcoded keyword rules (Korean and English).
 * @param {string} prompt - The user input
 * @returns {string|null} - The intent name if matched, else null
 */
export function getIntentFromPrompt(prompt) {
  const lowered = prompt.toLowerCase();

  if (prompt.includes("정리") || prompt.includes("요약") ||
      lowered.includes("summarize") || lowered.includes("summary")) {
    return "daily_intent_digest";
  }

  if ((prompt.includes("이미지") && prompt.includes("붙여")) ||
      (lowered.includes("image") && (lowered.includes("attach") || lowered.includes("add")))) {
    return "attach_image_to_any_post";
  }

  if ((prompt.includes("회의") && prompt.includes("변경")) ||
      (lowered.includes("meeting") && (lowered.includes("reschedule") || lowered.includes("change")))) {
    return "reschedule_meeting";
  }

  if (
    prompt.includes("기록") ||
    prompt.includes("아이디어") ||
    prompt.includes("음성") ||
    lowered.includes("record") ||
    lowered.includes("idea") ||
    lowered.includes("voice")
  ) {
    return "voice_to_anywhere";
  }

  return null;
}
