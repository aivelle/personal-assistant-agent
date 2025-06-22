#!/usr/bin/env node
// scripts/list-unused-workflows.js
// ✅ 연결 안 된 코드 탐지기

const fs = require('fs');
const path = require('path');

/**
 * Find workflows that are not connected to any scenarios
 */
function listUnusedWorkflows() {
  console.log('🔍 Scanning for unused workflows...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const srcWorkflowsDir = path.join(__dirname, '../src/workflows');
  
  const usedWorkflows = new Set();
  const allWorkflows = new Set();
  const unusedWorkflows = [];
  const orphanedScenarios = [];

  // Scan all scenario files to find referenced workflows
  if (fs.existsSync(scenarioDir)) {
    const scenarioFiles = fs.readdirSync(scenarioDir)
      .filter(file => file.endsWith('.json'));
    
    scenarioFiles.forEach(file => {
      try {
        const filePath = path.join(scenarioDir, file);
        const scenario = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const scenarioName = path.basename(file, '.json');
        
        // Check if corresponding workflow exists
        const workflowPath = path.join(srcWorkflowsDir, `${scenarioName}.js`);
        if (fs.existsSync(workflowPath)) {
          usedWorkflows.add(scenarioName);
        } else {
          orphanedScenarios.push({
            scenario: file,
            expectedWorkflow: `${scenarioName}.js`,
            path: filePath
          });
        }
        
        // Also check workflows array if it exists
        if (scenario.workflows && Array.isArray(scenario.workflows)) {
          scenario.workflows.forEach(workflowName => {
            usedWorkflows.add(workflowName);
          });
        }
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
      }
    });
  }

  // Scan all workflow files
  if (fs.existsSync(srcWorkflowsDir)) {
    const workflowFiles = fs.readdirSync(srcWorkflowsDir)
      .filter(file => file.endsWith('.js'));
    
    workflowFiles.forEach(file => {
      const workflowName = path.basename(file, '.js');
      allWorkflows.add(workflowName);
      
      if (!usedWorkflows.has(workflowName)) {
        unusedWorkflows.push({
          workflow: file,
          name: workflowName,
          path: path.join(srcWorkflowsDir, file),
          size: fs.statSync(path.join(srcWorkflowsDir, file)).size
        });
      }
    });
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalWorkflows: allWorkflows.size,
      usedWorkflows: usedWorkflows.size,
      unusedWorkflows: unusedWorkflows.length,
      orphanedScenarios: orphanedScenarios.length
    },
    unusedWorkflows,
    orphanedScenarios,
    recommendations: []
  };

  // Add recommendations
  if (unusedWorkflows.length > 0) {
    report.recommendations.push({
      type: 'cleanup',
      message: `Consider removing ${unusedWorkflows.length} unused workflow files`,
      files: unusedWorkflows.map(w => w.workflow)
    });
  }

  if (orphanedScenarios.length > 0) {
    report.recommendations.push({
      type: 'missing_implementation',
      message: `${orphanedScenarios.length} scenarios are missing workflow implementations`,
      files: orphanedScenarios.map(s => s.expectedWorkflow)
    });
  }

  // Output results
  console.log('\n📊 Unused Workflows Report:');
  console.log(`Total workflows: ${report.summary.totalWorkflows}`);
  console.log(`Used workflows: ${report.summary.usedWorkflows}`);
  console.log(`Unused workflows: ${report.summary.unusedWorkflows}`);
  console.log(`Orphaned scenarios: ${report.summary.orphanedScenarios}`);

  if (unusedWorkflows.length > 0) {
    console.log('\n🗑️  Unused Workflows:');
    unusedWorkflows.forEach(workflow => {
      console.log(`  - ${workflow.workflow} (${workflow.size} bytes)`);
    });
  }

  if (orphanedScenarios.length > 0) {
    console.log('\n👻 Orphaned Scenarios (missing workflows):');
    orphanedScenarios.forEach(scenario => {
      console.log(`  - ${scenario.scenario} → needs ${scenario.expectedWorkflow}`);
    });
  }

  // Save report
  const outputPath = path.join(__dirname, '../configs/unused-workflows-report.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved: ${outputPath}`);

  return report;
}

if (require.main === module) {
  listUnusedWorkflows();
}

module.exports = { listUnusedWorkflows }; 