/**
 * Handles the "daily_intent_digest" intent
 * @param {object} param
 * @param {string} param.prompt
 * @param {object} param.context
 * @returns {object}
 */
export async function run({ prompt, context }) {
  // Actual processing logic
  return {
    message: "Daily digest generated (mock)",
    prompt,
    target: "Digest/Notification (or elsewhere)",
  };
} 