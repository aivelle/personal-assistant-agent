#!/usr/bin/env node
// scripts/generate-router-index.js
// ✅ intent → code 경로 자동 정리

const fs = require('fs');
const path = require('path');

/**
 * Generate router index that maps intents to code paths
 */
function generateRouterIndex() {
  console.log('🔍 Scanning for intent mappings...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const srcDir = path.join(__dirname, '../src');
  const configsDir = path.join(__dirname, '../configs');
  
  const routerIndex = {
    intents: {},
    workflows: {},
    scenarios: {},
    generated: new Date().toISOString(),
    stats: {
      totalIntents: 0,
      mappedIntents: 0,
      unmappedIntents: 0
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
        const intentName = path.basename(file, '.json');
        
        routerIndex.scenarios[intentName] = {
          file: file,
          path: filePath,
          description: scenario.description || '',
          triggers: scenario.triggers || [],
          workflows: scenario.workflows || []
        };
        
        routerIndex.stats.totalIntents++;
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
      }
    });
  }

  // Scan workflow files in src/workflows
  const workflowsDir = path.join(srcDir, 'workflows');
  if (fs.existsSync(workflowsDir)) {
    const workflowFiles = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.js'));
    
    workflowFiles.forEach(file => {
      const workflowName = path.basename(file, '.js');
      const filePath = path.join(workflowsDir, file);
      
      routerIndex.workflows[workflowName] = {
        file: file,
        path: filePath,
        type: 'javascript'
      };
    });
  }

  // Generate intent mappings
  Object.keys(routerIndex.scenarios).forEach(intentName => {
    const scenario = routerIndex.scenarios[intentName];
    const hasWorkflow = routerIndex.workflows[intentName];
    
    routerIndex.intents[intentName] = {
      scenario: scenario.file,
      workflow: hasWorkflow ? hasWorkflow.file : null,
      mapped: !!hasWorkflow,
      triggers: scenario.triggers,
      description: scenario.description
    };
    
    if (hasWorkflow) {
      routerIndex.stats.mappedIntents++;
    } else {
      routerIndex.stats.unmappedIntents++;
    }
  });

  // Write router index
  const outputPath = path.join(configsDir, 'router-index.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(routerIndex, null, 2));
  
  console.log('✅ Router index generated:', outputPath);
  console.log(`📊 Stats: ${routerIndex.stats.totalIntents} total, ${routerIndex.stats.mappedIntents} mapped, ${routerIndex.stats.unmappedIntents} unmapped`);
  
  return routerIndex;
}

if (require.main === module) {
  generateRouterIndex();
}

module.exports = { generateRouterIndex }; 