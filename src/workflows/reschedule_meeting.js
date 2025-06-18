/**
 * Handles the "reschedule_meeting" intent
 * @param {object} param
 * @param {string} param.prompt
 * @param {object} param.context
 * @returns {object}
 */
export async function run({ prompt, context }) {
  // Actual processing logic
  return {
    message: "Meeting rescheduled (mock)",
    prompt,
    target: "Calendar/Meeting App (or elsewhere)",
  };
} 