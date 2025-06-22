#!/usr/bin/env node
// scripts/detect-conflicts.js
// 한 intent에 여러 개의 코드/시나리오가 연결되어 있는 경우 탐지

const fs = require('fs');
const path = require('path');

/**
 * Detect conflicts where one intent maps to multiple implementations
 */
function detectConflicts() {
  console.log('⚔️  Detecting intent conflicts...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const srcWorkflowsDir = path.join(__dirname, '../src/workflows');
  const configsDir = path.join(__dirname, '../configs');
  
  const conflictDetection = {
    timestamp: new Date().toISOString(),
    intentMap: {},
    conflicts: {
      multipleScenarios: [],
      multipleWorkflows: [],
      patternOverlaps: [],
      priorityConflicts: []
    },
    summary: {
      totalIntents: 0,
      conflictedIntents: 0,
      uniqueIntents: 0,
      severityDistribution: {
        high: 0,
        medium: 0,
        low: 0
      }
    },
    recommendations: []
  };

  // Scan scenario files to build intent map
  if (fs.existsSync(scenarioDir)) {
    const scenarioFiles = fs.readdirSync(scenarioDir)
      .filter(file => file.endsWith('.json'));
    
    scenarioFiles.forEach(file => {
      try {
        const filePath = path.join(scenarioDir, file);
        const scenario = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const scenarioName = path.basename(file, '.json');
        
        // Extract all possible intent identifiers
        const intentKeys = new Set();
        
        // Primary intent (filename)
        intentKeys.add(scenarioName.toLowerCase());
        
        // Alternative names from scenario
        if (scenario.intentName) {
          intentKeys.add(scenario.intentName.toLowerCase());
        }
        
        // Extract from triggers
        if (scenario.triggers && Array.isArray(scenario.triggers)) {
          scenario.triggers.forEach(trigger => {
            if (typeof trigger === 'string') {
              intentKeys.add(trigger.toLowerCase().replace(/\s+/g, '_'));
            } else if (trigger.intent) {
              intentKeys.add(trigger.intent.toLowerCase());
            }
          });
        }

        // Extract from examples (simple keyword extraction)
        if (scenario.examples && Array.isArray(scenario.examples)) {
          scenario.examples.forEach(example => {
            const keywords = extractKeywords(example);
            keywords.forEach(keyword => {
              if (keyword.length > 3) { // Only meaningful keywords
                intentKeys.add(keyword);
              }
            });
          });
        }

        // Map each intent key to this scenario
        intentKeys.forEach(intentKey => {
          if (!conflictDetection.intentMap[intentKey]) {
            conflictDetection.intentMap[intentKey] = {
              scenarios: [],
              workflows: [],
              patterns: [],
              priorities: []
            };
          }
          
          conflictDetection.intentMap[intentKey].scenarios.push({
            name: scenarioName,
            file,
            priority: scenario.priority || 100,
            enabled: scenario.enabled !== false,
            confidence: intentKey === scenarioName.toLowerCase() ? 1.0 : 0.7
          });
          
          if (scenario.priority) {
            conflictDetection.intentMap[intentKey].priorities.push({
              scenario: scenarioName,
              priority: scenario.priority
            });
          }
        });

        conflictDetection.summary.totalIntents++;

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
      const intentKey = workflowName.toLowerCase();
      
      if (!conflictDetection.intentMap[intentKey]) {
        conflictDetection.intentMap[intentKey] = {
          scenarios: [],
          workflows: [],
          patterns: [],
          priorities: []
        };
      }
      
      conflictDetection.intentMap[intentKey].workflows.push({
        name: workflowName,
        file,
        path: path.join(srcWorkflowsDir, file),
        size: fs.statSync(path.join(srcWorkflowsDir, file)).size
      });
    });
  }

  // Detect conflicts
  Object.entries(conflictDetection.intentMap).forEach(([intentKey, mapping]) => {
    let hasConflict = false;
    let severity = 'low';

    // Multiple scenarios for same intent
    if (mapping.scenarios.length > 1) {
      const conflict = {
        intent: intentKey,
        type: 'multiple_scenarios',
        scenarios: mapping.scenarios,
        severity: mapping.scenarios.length > 2 ? 'high' : 'medium',
        resolution: 'merge_or_disambiguate'
      };
      
      conflictDetection.conflicts.multipleScenarios.push(conflict);
      hasConflict = true;
      severity = conflict.severity;
    }

    // Multiple workflows for same intent
    if (mapping.workflows.length > 1) {
      const conflict = {
        intent: intentKey,
        type: 'multiple_workflows',
        workflows: mapping.workflows,
        severity: 'high', // Always high priority
        resolution: 'consolidate_or_rename'
      };
      
      conflictDetection.conflicts.multipleWorkflows.push(conflict);
      hasConflict = true;
      severity = 'high';
    }

    // Priority conflicts (same intent, different priorities)
    if (mapping.priorities.length > 1) {
      const uniquePriorities = [...new Set(mapping.priorities.map(p => p.priority))];
      if (uniquePriorities.length > 1) {
        const conflict = {
          intent: intentKey,
          type: 'priority_conflict',
          priorities: mapping.priorities,
          severity: 'medium',
          resolution: 'standardize_priority'
        };
        
        conflictDetection.conflicts.priorityConflicts.push(conflict);
        hasConflict = true;
        if (severity === 'low') severity = 'medium';
      }
    }

    if (hasConflict) {
      conflictDetection.summary.conflictedIntents++;
      conflictDetection.summary.severityDistribution[severity]++;
    } else {
      conflictDetection.summary.uniqueIntents++;
    }
  });

  // Detect pattern overlaps
  const patterns = [];
  Object.entries(conflictDetection.intentMap).forEach(([intentKey, mapping]) => {
    mapping.scenarios.forEach(scenario => {
      patterns.push({
        intent: intentKey,
        scenario: scenario.name,
        pattern: intentKey,
        confidence: scenario.confidence
      });
    });
  });

  // Find similar patterns
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const similarity = calculateSimilarity(patterns[i].pattern, patterns[j].pattern);
      if (similarity > 0.8 && patterns[i].scenario !== patterns[j].scenario) {
        conflictDetection.conflicts.patternOverlaps.push({
          pattern1: patterns[i],
          pattern2: patterns[j],
          similarity,
          type: 'pattern_overlap',
          severity: similarity > 0.9 ? 'high' : 'medium',
          resolution: 'disambiguate_patterns'
        });
      }
    }
  }

  // Generate recommendations
  if (conflictDetection.conflicts.multipleWorkflows.length > 0) {
    conflictDetection.recommendations.push({
      type: 'consolidate_workflows',
      priority: 'high',
      message: `${conflictDetection.conflicts.multipleWorkflows.length} intents have multiple workflow implementations`,
      action: 'Review and consolidate duplicate workflow files'
    });
  }

  if (conflictDetection.conflicts.multipleScenarios.length > 0) {
    conflictDetection.recommendations.push({
      type: 'merge_scenarios',
      priority: 'medium',
      message: `${conflictDetection.conflicts.multipleScenarios.length} intents have multiple scenario definitions`,
      action: 'Merge scenarios or add disambiguation rules'
    });
  }

  if (conflictDetection.conflicts.patternOverlaps.length > 0) {
    conflictDetection.recommendations.push({
      type: 'resolve_pattern_overlaps',
      priority: 'medium',
      message: `${conflictDetection.conflicts.patternOverlaps.length} pattern overlaps detected`,
      action: 'Add more specific triggers or examples to disambiguate'
    });
  }

  if (conflictDetection.summary.conflictedIntents > conflictDetection.summary.uniqueIntents) {
    conflictDetection.recommendations.push({
      type: 'overall_cleanup',
      priority: 'high',
      message: 'More conflicted intents than unique ones - major cleanup needed',
      action: 'Perform comprehensive intent consolidation'
    });
  }

  // Output results
  console.log('\n📊 Intent Conflict Detection:');
  console.log(`Total intents: ${conflictDetection.summary.totalIntents}`);
  console.log(`Unique intents: ${conflictDetection.summary.uniqueIntents}`);
  console.log(`Conflicted intents: ${conflictDetection.summary.conflictedIntents}`);
  console.log(`Severity: High(${conflictDetection.summary.severityDistribution.high}) Medium(${conflictDetection.summary.severityDistribution.medium}) Low(${conflictDetection.summary.severityDistribution.low})`);

  if (conflictDetection.conflicts.multipleWorkflows.length > 0) {
    console.log('\n⚔️  Multiple Workflows:');
    conflictDetection.conflicts.multipleWorkflows.forEach(conflict => {
      console.log(`  ${conflict.intent}: ${conflict.workflows.map(w => w.name).join(', ')}`);
    });
  }

  if (conflictDetection.conflicts.multipleScenarios.length > 0) {
    console.log('\n📋 Multiple Scenarios:');
    conflictDetection.conflicts.multipleScenarios.forEach(conflict => {
      console.log(`  ${conflict.intent}: ${conflict.scenarios.map(s => s.name).join(', ')}`);
    });
  }

  if (conflictDetection.conflicts.patternOverlaps.length > 0) {
    console.log('\n🔄 Pattern Overlaps:');
    conflictDetection.conflicts.patternOverlaps.forEach(conflict => {
      console.log(`  "${conflict.pattern1.pattern}" ↔ "${conflict.pattern2.pattern}" (${Math.round(conflict.similarity * 100)}%)`);
    });
  }

  if (conflictDetection.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    conflictDetection.recommendations.forEach(rec => {
      console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
      console.log(`    → ${rec.action}`);
    });
  }

  // Save conflict detection report
  const outputPath = path.join(configsDir, 'intent-conflicts.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(conflictDetection, null, 2));
  console.log(`\n✅ Conflict detection report saved: ${outputPath}`);

  return conflictDetection;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

if (require.main === module) {
  detectConflicts();
}

module.exports = { detectConflicts }; 