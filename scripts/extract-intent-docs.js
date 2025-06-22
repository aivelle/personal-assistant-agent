#!/usr/bin/env node
// scripts/extract-intent-docs.js
// ✨ 모든 시나리오 정리해 문서 생성

const fs = require('fs');
const path = require('path');

/**
 * Extract documentation from all scenarios
 */
function extractIntentDocs() {
  console.log('📚 Extracting intent documentation...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const outputDir = path.join(__dirname, '../docs');
  
  const documentation = {
    title: "AIVELLE Intent Documentation",
    generated: new Date().toISOString(),
    version: "1.0.0",
    summary: {
      totalIntents: 0,
      categories: {},
      coverage: {}
    },
    intents: []
  };

  // Scan scenario files
  if (fs.existsSync(scenarioDir)) {
    const scenarioFiles = fs.readdirSync(scenarioDir)
      .filter(file => file.endsWith('.json'))
      .sort();
    
    scenarioFiles.forEach(file => {
      try {
        const filePath = path.join(scenarioDir, file);
        const scenario = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const intentName = path.basename(file, '.json');
        
        const intentDoc = {
          name: intentName,
          title: scenario.title || intentName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: scenario.description || 'No description provided',
          category: scenario.category || 'General',
          priority: scenario.priority || 100,
          enabled: scenario.enabled !== false,
          triggers: scenario.triggers || [],
          examples: scenario.examples || [],
          parameters: scenario.parameters || [],
          responses: scenario.responses || [],
          workflows: scenario.workflows || [intentName],
          tags: scenario.tags || [],
          lastModified: fs.statSync(filePath).mtime.toISOString(),
          fileSize: fs.statSync(filePath).size
        };

        // Add usage examples
        if (scenario.usage) {
          intentDoc.usage = scenario.usage;
        }

        // Add error handling info
        if (scenario.errorHandling) {
          intentDoc.errorHandling = scenario.errorHandling;
        }

        documentation.intents.push(intentDoc);
        documentation.summary.totalIntents++;

        // Track categories
        if (!documentation.summary.categories[intentDoc.category]) {
          documentation.summary.categories[intentDoc.category] = 0;
        }
        documentation.summary.categories[intentDoc.category]++;

        // Track coverage
        const hasExamples = intentDoc.examples.length > 0;
        const hasDescription = intentDoc.description !== 'No description provided';
        const coverageLevel = hasExamples && hasDescription ? 'complete' : 
                             hasExamples || hasDescription ? 'partial' : 'minimal';
        
        if (!documentation.summary.coverage[coverageLevel]) {
          documentation.summary.coverage[coverageLevel] = 0;
        }
        documentation.summary.coverage[coverageLevel]++;

      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
      }
    });
  }

  // Sort intents by category, then by name
  documentation.intents.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  // Generate Markdown documentation
  const markdown = generateMarkdownDocs(documentation);
  
  // Generate JSON documentation
  const jsonDocs = JSON.stringify(documentation, null, 2);

  // Write files
  fs.mkdirSync(outputDir, { recursive: true });
  
  const mdPath = path.join(outputDir, 'intents.md');
  const jsonPath = path.join(outputDir, 'intents.json');
  
  fs.writeFileSync(mdPath, markdown);
  fs.writeFileSync(jsonPath, jsonDocs);

  console.log('✅ Documentation generated:');
  console.log(`  📄 Markdown: ${mdPath}`);
  console.log(`  📋 JSON: ${jsonPath}`);
  console.log(`📊 ${documentation.summary.totalIntents} intents documented across ${Object.keys(documentation.summary.categories).length} categories`);

  return documentation;
}

/**
 * Generate Markdown documentation
 */
function generateMarkdownDocs(documentation) {
  let markdown = `# ${documentation.title}\n\n`;
  markdown += `*Generated on ${new Date(documentation.generated).toLocaleString()}*\n\n`;
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `- **Total Intents**: ${documentation.summary.totalIntents}\n`;
  markdown += `- **Categories**: ${Object.keys(documentation.summary.categories).length}\n`;
  markdown += `- **Coverage**: ${Object.entries(documentation.summary.coverage).map(([level, count]) => `${count} ${level}`).join(', ')}\n\n`;

  // Categories
  markdown += `## 📂 Categories\n\n`;
  Object.entries(documentation.summary.categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      markdown += `- **${category}**: ${count} intents\n`;
    });
  markdown += '\n';

  // Table of Contents
  markdown += `## 📋 Table of Contents\n\n`;
  let currentCategory = '';
  documentation.intents.forEach(intent => {
    if (intent.category !== currentCategory) {
      currentCategory = intent.category;
      markdown += `\n### ${currentCategory}\n\n`;
    }
    markdown += `- [${intent.title}](#${intent.name.toLowerCase().replace(/[^a-z0-9]/g, '-')})\n`;
  });
  markdown += '\n---\n\n';

  // Intent Details
  markdown += `## 🎯 Intent Details\n\n`;
  currentCategory = '';
  documentation.intents.forEach(intent => {
    if (intent.category !== currentCategory) {
      currentCategory = intent.category;
      markdown += `\n## ${currentCategory}\n\n`;
    }

    markdown += `### ${intent.title}\n\n`;
    markdown += `**Intent Name**: \`${intent.name}\`\n\n`;
    markdown += `**Description**: ${intent.description}\n\n`;
    
    if (intent.enabled) {
      markdown += `**Status**: ✅ Enabled\n\n`;
    } else {
      markdown += `**Status**: ❌ Disabled\n\n`;
    }

    if (intent.triggers.length > 0) {
      markdown += `**Triggers**:\n`;
      intent.triggers.forEach(trigger => {
        if (typeof trigger === 'string') {
          markdown += `- \`${trigger}\`\n`;
        } else {
          markdown += `- \`${trigger.pattern}\` (${trigger.type || 'keyword'})\n`;
        }
      });
      markdown += '\n';
    }

    if (intent.examples.length > 0) {
      markdown += `**Examples**:\n`;
      intent.examples.forEach(example => {
        markdown += `- "${example}"\n`;
      });
      markdown += '\n';
    }

    if (intent.parameters.length > 0) {
      markdown += `**Parameters**:\n`;
      intent.parameters.forEach(param => {
        markdown += `- \`${param.name}\`: ${param.description || 'No description'}\n`;
      });
      markdown += '\n';
    }

    if (intent.workflows.length > 0) {
      markdown += `**Workflows**: ${intent.workflows.map(w => `\`${w}\``).join(', ')}\n\n`;
    }

    if (intent.tags.length > 0) {
      markdown += `**Tags**: ${intent.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
    }

    markdown += `**Priority**: ${intent.priority}\n\n`;
    markdown += `---\n\n`;
  });

  return markdown;
}

if (require.main === module) {
  extractIntentDocs();
}

module.exports = { extractIntentDocs }; 