/**
 * @intent intention_classifier
 * @description Classify the integration type or intent from user input.
 * @example "Classify this as a Notion integration"
 */
export async function run({ prompt, context }) {
  // TODO: Implement integration classification logic
  return {
    message: "Integration classified (mock)",
    prompt,
  };
} 