/**
 * Handles the "voice_to_anywhere" intent
 * @param {object} param
 * @param {string} param.prompt
 * @param {object} param.context
 * @returns {object}
 */
export async function run({ prompt, context }) {
  // Actual processing logic
  return {
    message: "Voice-based idea recorded",
    note: prompt,
    target: "Notion (or elsewhere)",
  };
} 