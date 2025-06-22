#!/usr/bin/env node
// scripts/generate-routing-rules.js
// ✨ rules 자동 생성기

const fs = require('fs');
const path = require('path');

/**
 * 디렉토리를 재귀적으로 탐색하여 JSON 파일들을 찾습니다
 * @param {string} dirPath - 탐색할 디렉토리 경로
 * @param {string[]} jsonFiles - 발견된 JSON 파일들을 저장할 배열
 */
function findJsonFiles(dirPath, jsonFiles = []) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 특정 폴더들은 제외 (legacy, automation 등)
      if (item === 'legacy' || item === 'automation' || item === 'create_scenarios') {
        console.log(`📁 Skipping folder: ${fullPath}`);
        continue;
      }
      findJsonFiles(fullPath, jsonFiles);
    } else if (stat.isFile() && path.extname(item) === '.json') {
      jsonFiles.push(fullPath);
    }
  }
  
  return jsonFiles;
}

/**
 * JSON 파일에서 시나리오 정보를 추출합니다
 * @param {string} filePath - JSON 파일 경로
 * @returns {Object|null} - 시나리오 정보 또는 null
 */
function extractScenarioInfo(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(content);
    
    // intent 필드가 없으면 건너뜀
    if (!jsonData.intent) {
      return null;
    }
    
    // 파일 경로에서 상대 경로 추출
    const relativePath = path.relative(process.cwd(), filePath);
    
    // intent에서 category와 name 추출
    const intentParts = jsonData.intent.split('.');
    if (intentParts.length !== 2) {
      console.warn(`⚠️  Invalid intent format: ${jsonData.intent} in ${relativePath}`);
      return null;
    }
    
    const [category, name] = intentParts;
    
    return {
      intent: jsonData.intent,
      category: category,
      name: name,
      title: jsonData.title || jsonData.name || name,
      description: jsonData.description || '',
      triggers: jsonData.triggers || [],
      examples: jsonData.examples || [],
      priority: jsonData.priority || 100,
      enabled: jsonData.enabled !== false, // 기본값은 true
      scenarioPath: relativePath,
      codePath: `src/workflows/${category}/${name}.js`
    };
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * 라우팅 규칙을 생성합니다
 * @param {Array} scenarios - 시나리오 정보 배열
 * @returns {Object} - 라우팅 규칙 객체
 */
function generateRoutingRules(scenarios) {
  // 카테고리별로 그룹화
  const categorizedScenarios = {};
  
  for (const scenario of scenarios) {
    if (!categorizedScenarios[scenario.category]) {
      categorizedScenarios[scenario.category] = [];
    }
    categorizedScenarios[scenario.category].push(scenario);
  }
  
  // 카테고리별로 정렬
  for (const category in categorizedScenarios) {
    categorizedScenarios[category].sort((a, b) => {
      // priority 높은 순, 같으면 name 알파벳 순
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  // 라우팅 규칙 생성
  const routingRules = {
    metadata: {
      version: "1.0.0",
      generated: new Date().toISOString(),
      description: "Auto-generated routing rules from scenario definitions",
      total_scenarios: scenarios.length,
      categories: Object.keys(categorizedScenarios).sort()
    },
    routing: {
      default_priority: 100,
      fallback_intent: "interact.chatResponse",
      rules: {}
    }
  };
  
  // 각 시나리오에 대한 규칙 생성
  for (const scenario of scenarios) {
    const rule = {
      intent: scenario.intent,
      category: scenario.category,
      name: scenario.name,
      title: scenario.title,
      description: scenario.description,
      priority: scenario.priority,
      enabled: scenario.enabled,
      paths: {
        scenario: scenario.scenarioPath,
        code: scenario.codePath
      },
      triggers: scenario.triggers,
      examples: scenario.examples
    };
    
    routingRules.routing.rules[scenario.intent] = rule;
  }
  
  return routingRules;
}

/**
 * 라우팅 규칙을 파일에 저장합니다
 * @param {Object} routingRules - 라우팅 규칙 객체
 * @param {string} outputPath - 출력 파일 경로
 */
function saveRoutingRules(routingRules, outputPath) {
  // 출력 디렉토리가 없으면 생성
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }
  
  // JSON 파일로 저장 (보기 좋게 포맷팅)
  const jsonContent = JSON.stringify(routingRules, null, 2);
  fs.writeFileSync(outputPath, jsonContent, 'utf8');
  
  console.log(`💾 Routing rules saved to: ${outputPath}`);
}

/**
 * 통계 정보를 출력합니다
 * @param {Object} routingRules - 라우팅 규칙 객체
 */
function printStatistics(routingRules) {
  const { metadata, routing } = routingRules;
  const rules = routing.rules;
  
  console.log('\n📊 Generation Statistics:');
  console.log(`   Total scenarios: ${metadata.total_scenarios}`);
  console.log(`   Categories: ${metadata.categories.length}`);
  console.log(`   Generated rules: ${Object.keys(rules).length}`);
  
  // 카테고리별 통계
  const categoryStats = {};
  for (const intent in rules) {
    const category = rules[intent].category;
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  }
  
  console.log('\n📂 Category breakdown:');
  for (const category of metadata.categories) {
    const count = categoryStats[category] || 0;
    console.log(`   ${category}: ${count} scenarios`);
  }
  
  // 비활성화된 시나리오 확인
  const disabledCount = Object.values(rules).filter(rule => !rule.enabled).length;
  if (disabledCount > 0) {
    console.log(`\n⚠️  Disabled scenarios: ${disabledCount}`);
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🚀 Starting routing rules generation...\n');
  
  const scenarioDir = path.join(process.cwd(), 'scenario');
  const outputPath = path.join(process.cwd(), 'rules', 'routing-rules.json');
  
  // scenario 디렉토리 존재 확인
  if (!fs.existsSync(scenarioDir)) {
    console.error('❌ Error: scenario/ directory not found');
    process.exit(1);
  }
  
  // JSON 파일들 찾기
  console.log('📂 Scanning for JSON files in scenario/ directory...');
  const jsonFiles = findJsonFiles(scenarioDir);
  
  if (jsonFiles.length === 0) {
    console.log('ℹ️  No JSON files found in scenario/ directory');
    return;
  }
  
  console.log(`📋 Found ${jsonFiles.length} JSON files\n`);
  
  // 시나리오 정보 추출
  console.log('🔍 Extracting scenario information...');
  const scenarios = [];
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const filePath of jsonFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`   Processing: ${relativePath}`);
    
    const scenarioInfo = extractScenarioInfo(filePath);
    if (scenarioInfo) {
      scenarios.push(scenarioInfo);
      processedCount++;
      console.log(`     ✅ Intent: ${scenarioInfo.intent}`);
    } else {
      skippedCount++;
      console.log(`     ⏭️  Skipped`);
    }
  }
  
  console.log(`\n📈 Processing complete:`);
  console.log(`   Processed: ${processedCount} scenarios`);
  console.log(`   Skipped: ${skippedCount} files`);
  
  if (scenarios.length === 0) {
    console.log('\n❌ No valid scenarios found. Cannot generate routing rules.');
    process.exit(1);
  }
  
  // 라우팅 규칙 생성
  console.log('\n⚙️  Generating routing rules...');
  const routingRules = generateRoutingRules(scenarios);
  
  // 파일에 저장
  console.log('💾 Saving routing rules...');
  saveRoutingRules(routingRules, outputPath);
  
  // 통계 출력
  printStatistics(routingRules);
  
  console.log('\n🎉 Routing rules generation completed successfully!');
  console.log(`📄 Output file: ${outputPath}`);
}

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  findJsonFiles,
  extractScenarioInfo,
  generateRoutingRules,
  saveRoutingRules,
  main
}; 