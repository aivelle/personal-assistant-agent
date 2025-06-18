/**
 * Handles the "attach_image_to_any_post" intent
 * @param {object} param
 * @param {string} param.prompt
 * @param {object} param.context
 * @returns {object}
 */
export async function run({ prompt, context }) {
  // Actual processing logic
  return {
    message: "Image attached to post (mock)",
    prompt,
    target: "Social Media Post (or elsewhere)",
  };
} 