#!/usr/bin/env node
// scripts/scan-automation-mapping.js
// ✨ 자동화 JSON 흐름이 의도대로 연결되어 있는지 점검

const fs = require('fs');
const path = require('path');

/**
 * Scan automation mapping and workflow connections
 */
function scanAutomationMapping() {
  console.log('🔄 Scanning automation mappings...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const automationDir = path.join(scenarioDir, 'automation');
  const srcDir = path.join(__dirname, '../src');
  const configsDir = path.join(__dirname, '../configs');
  
  const automationScan = {
    timestamp: new Date().toISOString(),
    automations: {},
    flows: [],
    mappings: {},
    issues: {
      brokenFlows: [],
      missingSteps: [],
      circularFlows: [],
      unreachableSteps: []
    },
    summary: {
      totalAutomations: 0,
      totalFlows: 0,
      connectedFlows: 0,
      brokenFlows: 0,
      healthScore: 0
    }
  };

  // Scan automation directory
  if (fs.existsSync(automationDir)) {
    const automationFiles = fs.readdirSync(automationDir)
      .filter(file => file.endsWith('.json'));
    
    automationFiles.forEach(file => {
      try {
        const filePath = path.join(automationDir, file);
        const automation = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const automationName = path.basename(file, '.json');
        
        const automationInfo = {
          name: automationName,
          file,
          path: filePath,
          description: automation.description || '',
          enabled: automation.enabled !== false,
          triggers: automation.triggers || [],
          steps: automation.steps || [],
          flows: automation.flows || [],
          dependencies: automation.dependencies || [],
          outputs: automation.outputs || [],
          errorHandling: automation.errorHandling || {}
        };

        // Analyze steps
        automationInfo.steps.forEach((step, index) => {
          const stepInfo = {
            id: step.id || `step_${index}`,
            type: step.type || 'unknown',
            action: step.action,
            inputs: step.inputs || {},
            outputs: step.outputs || {},
            nextSteps: step.nextSteps || [],
            conditions: step.conditions || [],
            automation: automationName,
            index
          };

          // Check if step implementation exists
          if (step.workflow) {
            const workflowPath = path.join(srcDir, 'workflows', `${step.workflow}.js`);
            stepInfo.hasImplementation = fs.existsSync(workflowPath);
            stepInfo.implementationPath = workflowPath;
            
            if (!stepInfo.hasImplementation) {
              automationScan.issues.missingSteps.push({
                automation: automationName,
                step: stepInfo.id,
                workflow: step.workflow,
                expectedPath: workflowPath
              });
            }
          }

          automationScan.mappings[stepInfo.id] = stepInfo;
        });

        // Analyze flows
        automationInfo.flows.forEach((flow, flowIndex) => {
          const flowInfo = {
            id: flow.id || `flow_${flowIndex}`,
            name: flow.name || `Flow ${flowIndex + 1}`,
            automation: automationName,
            startStep: flow.startStep,
            endStep: flow.endStep,
            steps: flow.steps || [],
            conditions: flow.conditions || [],
            isValid: true,
            issues: []
          };

          // Validate flow steps exist
          flowInfo.steps.forEach(stepId => {
            if (!automationScan.mappings[stepId]) {
              flowInfo.isValid = false;
              flowInfo.issues.push(`Step ${stepId} not found`);
              automationScan.issues.brokenFlows.push({
                automation: automationName,
                flow: flowInfo.id,
                issue: `missing_step_${stepId}`
              });
            }
          });

          // Check for circular references
          const visited = new Set();
          const checkCircular = (stepId, path = []) => {
            if (visited.has(stepId)) {
              automationScan.issues.circularFlows.push({
                automation: automationName,
                flow: flowInfo.id,
                path: [...path, stepId],
                issue: 'circular_reference'
              });
              return true;
            }
            
            visited.add(stepId);
            const step = automationScan.mappings[stepId];
            if (step && step.nextSteps) {
              for (const nextStep of step.nextSteps) {
                if (checkCircular(nextStep, [...path, stepId])) {
                  return true;
                }
              }
            }
            visited.delete(stepId);
            return false;
          };

          if (flowInfo.startStep) {
            checkCircular(flowInfo.startStep);
          }

          automationScan.flows.push(flowInfo);
          automationScan.summary.totalFlows++;
          
          if (flowInfo.isValid) {
            automationScan.summary.connectedFlows++;
          } else {
            automationScan.summary.brokenFlows++;
          }
        });

        automationScan.automations[automationName] = automationInfo;
        automationScan.summary.totalAutomations++;

      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
      }
    });
  }

  // Find unreachable steps
  const reachableSteps = new Set();
  automationScan.flows.forEach(flow => {
    const traverse = (stepId) => {
      if (reachableSteps.has(stepId)) return;
      reachableSteps.add(stepId);
      
      const step = automationScan.mappings[stepId];
      if (step && step.nextSteps) {
        step.nextSteps.forEach(nextStepId => {
          traverse(nextStepId);
        });
      }
    };

    if (flow.startStep) {
      traverse(flow.startStep);
    }
  });

  Object.values(automationScan.mappings).forEach(step => {
    if (!reachableSteps.has(step.id)) {
      automationScan.issues.unreachableSteps.push({
        automation: step.automation,
        step: step.id,
        type: step.type,
        issue: 'unreachable_step'
      });
    }
  });

  // Calculate health score
  const totalFlows = automationScan.summary.totalFlows;
  const healthyFlows = automationScan.summary.connectedFlows;
  automationScan.summary.healthScore = totalFlows > 0 
    ? Math.round((healthyFlows / totalFlows) * 100) 
    : 100;

  // Generate flow diagram data
  const flowDiagram = generateFlowDiagram(automationScan);
  automationScan.flowDiagram = flowDiagram;

  // Output results
  console.log('\n📊 Automation Mapping Scan:');
  console.log(`Total automations: ${automationScan.summary.totalAutomations}`);
  console.log(`Total flows: ${automationScan.summary.totalFlows}`);
  console.log(`Connected flows: ${automationScan.summary.connectedFlows}`);
  console.log(`Broken flows: ${automationScan.summary.brokenFlows}`);
  console.log(`Health score: ${automationScan.summary.healthScore}%`);

  if (automationScan.issues.brokenFlows.length > 0) {
    console.log('\n❌ Broken Flows:');
    automationScan.issues.brokenFlows.forEach(issue => {
      console.log(`  ${issue.automation}.${issue.flow}: ${issue.issue}`);
    });
  }

  if (automationScan.issues.missingSteps.length > 0) {
    console.log('\n🚫 Missing Steps:');
    automationScan.issues.missingSteps.forEach(issue => {
      console.log(`  ${issue.automation}.${issue.step} → needs ${issue.workflow}.js`);
    });
  }

  if (automationScan.issues.circularFlows.length > 0) {
    console.log('\n🔄 Circular Flows:');
    automationScan.issues.circularFlows.forEach(issue => {
      console.log(`  ${issue.automation}.${issue.flow}: ${issue.path.join(' → ')}`);
    });
  }

  if (automationScan.issues.unreachableSteps.length > 0) {
    console.log('\n👻 Unreachable Steps:');
    automationScan.issues.unreachableSteps.forEach(issue => {
      console.log(`  ${issue.automation}.${issue.step} (${issue.type})`);
    });
  }

  // Generate recommendations
  const recommendations = [];
  
  if (automationScan.issues.brokenFlows.length > 0) {
    recommendations.push({
      type: 'fix_broken_flows',
      priority: 'high',
      count: automationScan.issues.brokenFlows.length,
      message: `Fix ${automationScan.issues.brokenFlows.length} broken automation flows`
    });
  }

  if (automationScan.issues.missingSteps.length > 0) {
    recommendations.push({
      type: 'implement_missing_steps',
      priority: 'high',
      count: automationScan.issues.missingSteps.length,
      message: `Implement ${automationScan.issues.missingSteps.length} missing workflow steps`
    });
  }

  if (automationScan.issues.unreachableSteps.length > 0) {
    recommendations.push({
      type: 'cleanup_unreachable',
      priority: 'medium',
      count: automationScan.issues.unreachableSteps.length,
      message: `Remove or connect ${automationScan.issues.unreachableSteps.length} unreachable steps`
    });
  }

  if (automationScan.summary.healthScore < 90) {
    recommendations.push({
      type: 'improve_automation_health',
      priority: 'high',
      message: `Automation health score is ${automationScan.summary.healthScore}% - needs improvement`
    });
  }

  automationScan.recommendations = recommendations;

  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => {
      console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
    });
  }

  // Save automation scan report
  const outputPath = path.join(configsDir, 'automation-mapping.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(automationScan, null, 2));
  console.log(`\n✅ Automation mapping report saved: ${outputPath}`);

  return automationScan;
}

/**
 * Generate flow diagram data for visualization
 */
function generateFlowDiagram(automationScan) {
  const diagram = {
    nodes: [],
    edges: [],
    clusters: {}
  };

  // Create nodes for each step
  Object.values(automationScan.mappings).forEach(step => {
    diagram.nodes.push({
      id: step.id,
      label: step.action || step.id,
      type: step.type,
      automation: step.automation,
      hasImplementation: step.hasImplementation,
      group: step.automation
    });
  });

  // Create edges for step connections
  Object.values(automationScan.mappings).forEach(step => {
    if (step.nextSteps) {
      step.nextSteps.forEach(nextStepId => {
        diagram.edges.push({
          from: step.id,
          to: nextStepId,
          automation: step.automation,
          type: 'flow'
        });
      });
    }
  });

  // Group by automation
  Object.keys(automationScan.automations).forEach(automationName => {
    diagram.clusters[automationName] = {
      label: automationName,
      nodes: diagram.nodes.filter(node => node.automation === automationName).map(node => node.id)
    };
  });

  return diagram;
}

if (require.main === module) {
  scanAutomationMapping();
}

module.exports = { scanAutomationMapping }; 