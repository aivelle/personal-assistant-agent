#!/usr/bin/env node
// scripts/verify-intent-map.js
// ✨ natural input → intent map 검증

const fs = require('fs');
const path = require('path');

/**
 * Verify that natural language inputs map correctly to intents
 */
function verifyIntentMap() {
  console.log('🔍 Verifying intent mappings...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const configsDir = path.join(__dirname, '../configs');
  
  const verification = {
    timestamp: new Date().toISOString(),
    intents: {},
    conflicts: [],
    coverage: {
      totalIntents: 0,
      withExamples: 0,
      withoutExamples: 0,
      averageExamples: 0
    },
    recommendations: []
  };

  let totalExamples = 0;

  // Scan scenario files
  if (fs.existsSync(scenarioDir)) {
    const scenarioFiles = fs.readdirSync(scenarioDir)
      .filter(file => file.endsWith('.json'));
    
    scenarioFiles.forEach(file => {
      try {
        const filePath = path.join(scenarioDir, file);
        const scenario = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const intentName = path.basename(file, '.json');
        
        const intentInfo = {
          file: file,
          description: scenario.description || '',
          triggers: scenario.triggers || [],
          examples: scenario.examples || [],
          patterns: [],
          coverage: 'none'
        };

        // Analyze triggers
        if (scenario.triggers && Array.isArray(scenario.triggers)) {
          scenario.triggers.forEach(trigger => {
            if (typeof trigger === 'string') {
              intentInfo.patterns.push({
                type: 'keyword',
                value: trigger.toLowerCase(),
                source: 'trigger'
              });
            } else if (trigger.pattern) {
              intentInfo.patterns.push({
                type: trigger.type || 'regex',
                value: trigger.pattern.toLowerCase(),
                source: 'trigger'
              });
            }
          });
        }

        // Analyze examples
        if (scenario.examples && Array.isArray(scenario.examples)) {
          scenario.examples.forEach(example => {
            intentInfo.patterns.push({
              type: 'natural',
              value: example.toLowerCase(),
              source: 'example'
            });
          });
          totalExamples += scenario.examples.length;
          verification.coverage.withExamples++;
          intentInfo.coverage = scenario.examples.length >= 3 ? 'good' : 'minimal';
        } else {
          verification.coverage.withoutExamples++;
          intentInfo.coverage = 'none';
        }

        verification.intents[intentName] = intentInfo;
        verification.coverage.totalIntents++;

      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
      }
    });
  }

  // Calculate coverage stats
  verification.coverage.averageExamples = verification.coverage.totalIntents > 0 
    ? Math.round(totalExamples / verification.coverage.totalIntents * 10) / 10 
    : 0;

  // Detect conflicts (similar patterns mapping to different intents)
  const patternMap = new Map();
  
  Object.entries(verification.intents).forEach(([intent, info]) => {
    info.patterns.forEach(pattern => {
      const key = pattern.value;
      if (!patternMap.has(key)) {
        patternMap.set(key, []);
      }
      patternMap.get(key).push({
        intent,
        type: pattern.type,
        source: pattern.source
      });
    });
  });

  // Find conflicts
  patternMap.forEach((intents, pattern) => {
    if (intents.length > 1) {
      verification.conflicts.push({
        pattern,
        conflictingIntents: intents.map(i => i.intent),
        types: [...new Set(intents.map(i => i.type))],
        severity: intents.length > 2 ? 'high' : 'medium'
      });
    }
  });

  // Generate recommendations
  if (verification.coverage.withoutExamples > 0) {
    verification.recommendations.push({
      type: 'missing_examples',
      priority: 'high',
      message: `${verification.coverage.withoutExamples} intents have no examples`,
      intents: Object.entries(verification.intents)
        .filter(([_, info]) => info.examples.length === 0)
        .map(([intent, _]) => intent)
    });
  }

  if (verification.conflicts.length > 0) {
    verification.recommendations.push({
      type: 'pattern_conflicts',
      priority: 'high',
      message: `${verification.conflicts.length} pattern conflicts detected`,
      conflicts: verification.conflicts.filter(c => c.severity === 'high')
    });
  }

  if (verification.coverage.averageExamples < 3) {
    verification.recommendations.push({
      type: 'insufficient_examples',
      priority: 'medium',
      message: `Average ${verification.coverage.averageExamples} examples per intent (recommended: 3+)`,
      suggestion: 'Add more natural language examples for better intent recognition'
    });
  }

  // Output results
  console.log('\n📊 Intent Map Verification:');
  console.log(`Total intents: ${verification.coverage.totalIntents}`);
  console.log(`With examples: ${verification.coverage.withExamples}`);
  console.log(`Without examples: ${verification.coverage.withoutExamples}`);
  console.log(`Average examples: ${verification.coverage.averageExamples}`);
  console.log(`Conflicts found: ${verification.conflicts.length}`);

  if (verification.conflicts.length > 0) {
    console.log('\n⚠️  Pattern Conflicts:');
    verification.conflicts.forEach(conflict => {
      console.log(`  "${conflict.pattern}" → ${conflict.conflictingIntents.join(', ')} (${conflict.severity})`);
    });
  }

  if (verification.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    verification.recommendations.forEach(rec => {
      console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
    });
  }

  // Save verification report
  const outputPath = path.join(configsDir, 'intent-verification.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(verification, null, 2));
  console.log(`\n✅ Verification report saved: ${outputPath}`);

  return verification;
}

if (require.main === module) {
  verifyIntentMap();
}

module.exports = { verifyIntentMap }; 