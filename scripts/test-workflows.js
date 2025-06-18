import { workflows } from '../src/workflow-engine.js';

async function testAllWorkflows() {
  for (const [intent, workflow] of Object.entries(workflows)) {
    if (workflow.run) {
      const result = await workflow.run({ prompt: `Test prompt for ${intent}`, context: {} });
      console.log(`[${intent}] result:`, result);
    } else {
      console.warn(`[${intent}] has no run function.`);
    }
  }
}

testAllWorkflows(); 