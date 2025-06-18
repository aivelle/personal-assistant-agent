// scripts/generate-workflow-docs.js
import { workflows } from '../src/workflow-engine.js';

console.log('# Workflow Documentation\n');

for (const [intent, workflow] of Object.entries(workflows)) {
  if (workflow.run) {
    console.log(`## ${intent}\n`);
    // Print the function signature and JSDoc (as string)
    console.log(workflow.run.toString());
    console.log('\n---\n');
  }
} 