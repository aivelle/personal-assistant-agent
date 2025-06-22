#!/usr/bin/env node
// scripts/check-scenario-links.js
// ✨ 시나리오 ↔ 코드 연결 점검

const fs = require('fs');
const path = require('path');

/**
 * Check connections between scenarios and code implementations
 */
function checkScenarioLinks() {
  console.log('🔗 Checking scenario-code links...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const srcWorkflowsDir = path.join(__dirname, '../src/workflows');
  const configsDir = path.join(__dirname, '../configs');
  
  const linkCheck = {
    timestamp: new Date().toISOString(),
    scenarios: {},
    workflows: {},
    connections: [],
    issues: {
      missingWorkflows: [],
      orphanedWorkflows: [],
      brokenReferences: [],
      circularReferences: []
    },
    summary: {
      totalScenarios: 0,
      totalWorkflows: 0,
      connectedScenarios: 0,
      orphanedWorkflows: 0,
      healthScore: 0
    }
  };

  // Scan scenario files
  if (fs.existsSync(scenarioDir)) {
    const scenarioFiles = fs.readdirSync(scenarioDir)
      .filter(file => file.endsWith('.json'));
    
    scenarioFiles.forEach(file => {
      try {
        const filePath = path.join(scenarioDir, file);
        const scenario = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const scenarioName = path.basename(file, '.json');
        
        const scenarioInfo = {
          name: scenarioName,
          file,
          path: filePath,
          workflows: scenario.workflows || [scenarioName],
          dependencies: scenario.dependencies || [],
          enabled: scenario.enabled !== false,
          hasImplementation: false,
          implementationFiles: []
        };

        // Check if corresponding workflow exists
        scenarioInfo.workflows.forEach(workflowName => {
          const workflowPath = path.join(srcWorkflowsDir, `${workflowName}.js`);
          if (fs.existsSync(workflowPath)) {
            scenarioInfo.hasImplementation = true;
            scenarioInfo.implementationFiles.push(`${workflowName}.js`);
          } else {
            linkCheck.issues.missingWorkflows.push({
              scenario: scenarioName,
              missingWorkflow: `${workflowName}.js`,
              expectedPath: workflowPath
            });
          }
        });

        linkCheck.scenarios[scenarioName] = scenarioInfo;
        linkCheck.summary.totalScenarios++;
        
        if (scenarioInfo.hasImplementation) {
          linkCheck.summary.connectedScenarios++;
        }

      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
      }
    });
  }

  // Scan workflow files
  if (fs.existsSync(srcWorkflowsDir)) {
    const workflowFiles = fs.readdirSync(srcWorkflowsDir)
      .filter(file => file.endsWith('.js'));
    
    workflowFiles.forEach(file => {
      const workflowName = path.basename(file, '.js');
      const filePath = path.join(srcWorkflowsDir, file);
      
      const workflowInfo = {
        name: workflowName,
        file,
        path: filePath,
        hasScenario: !!linkCheck.scenarios[workflowName],
        referencedBy: [],
        size: fs.statSync(filePath).size,
        lastModified: fs.statSync(filePath).mtime.toISOString()
      };

      // Find which scenarios reference this workflow
      Object.values(linkCheck.scenarios).forEach(scenario => {
        if (scenario.workflows.includes(workflowName)) {
          workflowInfo.referencedBy.push(scenario.name);
        }
      });

      if (workflowInfo.referencedBy.length === 0 && !workflowInfo.hasScenario) {
        linkCheck.issues.orphanedWorkflows.push({
          workflow: workflowName,
          file,
          size: workflowInfo.size
        });
        linkCheck.summary.orphanedWorkflows++;
      }

      linkCheck.workflows[workflowName] = workflowInfo;
      linkCheck.summary.totalWorkflows++;
    });
  }

  // Create connection map
  Object.values(linkCheck.scenarios).forEach(scenario => {
    scenario.workflows.forEach(workflowName => {
      const workflow = linkCheck.workflows[workflowName];
      if (workflow) {
        linkCheck.connections.push({
          scenario: scenario.name,
          workflow: workflowName,
          type: 'implementation',
          status: 'connected'
        });
      } else {
        linkCheck.connections.push({
          scenario: scenario.name,
          workflow: workflowName,
          type: 'implementation',
          status: 'broken'
        });
        
        linkCheck.issues.brokenReferences.push({
          scenario: scenario.name,
          workflow: workflowName,
          issue: 'workflow_not_found'
        });
      }
    });
  });

  // Check for circular references
  Object.values(linkCheck.scenarios).forEach(scenario => {
    const visited = new Set();
    const checkCircular = (scenarioName, path = []) => {
      if (visited.has(scenarioName)) {
        linkCheck.issues.circularReferences.push({
          scenario: scenarioName,
          path: [...path, scenarioName],
          issue: 'circular_dependency'
        });
        return;
      }
      
      visited.add(scenarioName);
      const currentScenario = linkCheck.scenarios[scenarioName];
      if (currentScenario && currentScenario.dependencies) {
        currentScenario.dependencies.forEach(dep => {
          checkCircular(dep, [...path, scenarioName]);
        });
      }
      visited.delete(scenarioName);
    };
    
    checkCircular(scenario.name);
  });

  // Calculate health score
  const totalConnections = linkCheck.summary.totalScenarios;
  const healthyConnections = linkCheck.summary.connectedScenarios;
  linkCheck.summary.healthScore = totalConnections > 0 
    ? Math.round((healthyConnections / totalConnections) * 100) 
    : 100;

  // Output results
  console.log('\n📊 Scenario-Code Link Check:');
  console.log(`Total scenarios: ${linkCheck.summary.totalScenarios}`);
  console.log(`Total workflows: ${linkCheck.summary.totalWorkflows}`);
  console.log(`Connected scenarios: ${linkCheck.summary.connectedScenarios}`);
  console.log(`Orphaned workflows: ${linkCheck.summary.orphanedWorkflows}`);
  console.log(`Health score: ${linkCheck.summary.healthScore}%`);

  if (linkCheck.issues.missingWorkflows.length > 0) {
    console.log('\n❌ Missing Workflows:');
    linkCheck.issues.missingWorkflows.forEach(issue => {
      console.log(`  ${issue.scenario} → needs ${issue.missingWorkflow}`);
    });
  }

  if (linkCheck.issues.orphanedWorkflows.length > 0) {
    console.log('\n👻 Orphaned Workflows:');
    linkCheck.issues.orphanedWorkflows.forEach(issue => {
      console.log(`  ${issue.file} (${issue.size} bytes) - no scenario references`);
    });
  }

  if (linkCheck.issues.brokenReferences.length > 0) {
    console.log('\n🔗 Broken References:');
    linkCheck.issues.brokenReferences.forEach(issue => {
      console.log(`  ${issue.scenario} → ${issue.workflow} (${issue.issue})`);
    });
  }

  if (linkCheck.issues.circularReferences.length > 0) {
    console.log('\n🔄 Circular References:');
    linkCheck.issues.circularReferences.forEach(issue => {
      console.log(`  ${issue.path.join(' → ')} (circular dependency)`);
    });
  }

  // Generate recommendations
  const recommendations = [];
  
  if (linkCheck.issues.missingWorkflows.length > 0) {
    recommendations.push({
      type: 'create_workflows',
      priority: 'high',
      count: linkCheck.issues.missingWorkflows.length,
      message: `Create ${linkCheck.issues.missingWorkflows.length} missing workflow implementations`
    });
  }

  if (linkCheck.issues.orphanedWorkflows.length > 0) {
    recommendations.push({
      type: 'cleanup_orphans',
      priority: 'medium',
      count: linkCheck.issues.orphanedWorkflows.length,
      message: `Remove or connect ${linkCheck.issues.orphanedWorkflows.length} orphaned workflows`
    });
  }

  if (linkCheck.summary.healthScore < 80) {
    recommendations.push({
      type: 'improve_connections',
      priority: 'high',
      message: `Health score is ${linkCheck.summary.healthScore}% - improve scenario-workflow connections`
    });
  }

  linkCheck.recommendations = recommendations;

  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => {
      console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
    });
  }

  // Save link check report
  const outputPath = path.join(configsDir, 'scenario-links.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(linkCheck, null, 2));
  console.log(`\n✅ Link check report saved: ${outputPath}`);

  return linkCheck;
}

if (require.main === module) {
  checkScenarioLinks();
}

module.exports = { checkScenarioLinks }; 