import promptRouter from "../configs/prompt-router.json" assert { type: 'json' };

/**
 * Analyzes a user's prompt and returns the matched intent route
 * @param {string} prompt - The user input
 * @returns {string|null} - The route name if matched, else null
 */
export function getIntentFromPrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  for (const route of promptRouter.routes) {
    if (route.prompt_keywords) {
      for (const keyword of route.prompt_keywords) {
        if (lowerPrompt.includes(keyword)) {
          return route.intent;
        }
      }
    }
  }

  return null; // No match
} 