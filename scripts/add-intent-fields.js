#!/usr/bin/env node

// scripts/add-intent-fields.js
// scenario/{intent}/{name}.json 파일들에 "intent": "{intent}.{name}" 필드를 자동으로 추가하는 스크립트

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
 * 파일 경로에서 intent 값을 생성합니다
 * @param {string} filePath - JSON 파일 경로
 * @returns {string|null} - 생성된 intent 값 또는 null
 */
function generateIntentFromPath(filePath) {
  // scenario/ 이후의 경로를 추출
  const relativePath = path.relative('scenario', filePath);
  const parts = relativePath.split(path.sep);
  
  // scenario/{category}/{name}.json 구조여야 함
  if (parts.length !== 2) {
    return null;
  }
  
  const category = parts[0];
  const filename = path.basename(parts[1], '.json');
  
  return `${category}.${filename}`;
}

/**
 * JSON 파일에 intent 필드를 추가합니다
 * @param {string} filePath - JSON 파일 경로
 * @returns {Object} - 처리 결과
 */
function addIntentField(filePath) {
  try {
    // 파일 읽기
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(content);
    
    // intent 값 생성
    const intentValue = generateIntentFromPath(filePath);
    if (!intentValue) {
      return {
        success: false,
        action: 'skip',
        reason: 'Invalid file path structure'
      };
    }
    
    // 이미 intent 필드가 있는지 확인
    if (jsonData.hasOwnProperty('intent')) {
      return {
        success: true,
        action: 'skip',
        reason: 'Intent field already exists',
        currentValue: jsonData.intent,
        expectedValue: intentValue
      };
    }
    
    // intent 필드 추가 (name 필드 다음에 위치하도록)
    const orderedData = {};
    
    // 기존 필드 순서 유지하면서 intent 추가
    for (const [key, value] of Object.entries(jsonData)) {
      orderedData[key] = value;
      
      // name 필드 다음에 intent 추가
      if (key === 'name') {
        orderedData.intent = intentValue;
      }
    }
    
    // name 필드가 없는 경우 맨 앞에 추가
    if (!jsonData.hasOwnProperty('name')) {
      const finalData = { intent: intentValue, ...orderedData };
      Object.assign(orderedData, finalData);
    }
    
    // 파일에 다시 쓰기 (보기 좋게 포맷팅)
    const updatedContent = JSON.stringify(orderedData, null, 2);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    return {
      success: true,
      action: 'added',
      intentValue: intentValue
    };
    
  } catch (error) {
    return {
      success: false,
      action: 'error',
      error: error.message
    };
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🚀 Starting intent field addition process...\n');
  
  const scenarioDir = path.join(process.cwd(), 'scenario');
  
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
  
  // 결과 통계
  const stats = {
    total: 0,
    added: 0,
    skipped: 0,
    errors: 0
  };
  
  // 각 파일 처리
  for (const filePath of jsonFiles) {
    stats.total++;
    const relativePath = path.relative(process.cwd(), filePath);
    
    console.log(`📄 Processing: ${relativePath}`);
    
    const result = addIntentField(filePath);
    
    switch (result.action) {
      case 'added':
        console.log(`   ✅ Added intent: "${result.intentValue}"`);
        stats.added++;
        break;
        
      case 'skip':
        if (result.currentValue && result.expectedValue && result.currentValue !== result.expectedValue) {
          console.log(`   ⚠️  Skipped: ${result.reason}`);
          console.log(`      Current: "${result.currentValue}"`);
          console.log(`      Expected: "${result.expectedValue}"`);
        } else {
          console.log(`   ⏭️  Skipped: ${result.reason}`);
        }
        stats.skipped++;
        break;
        
      case 'error':
        console.log(`   ❌ Error: ${result.error}`);
        stats.errors++;
        break;
    }
    
    console.log(''); // 빈 줄 추가
  }
  
  // 최종 결과 출력
  console.log('📊 Summary:');
  console.log(`   Total files processed: ${stats.total}`);
  console.log(`   Intent fields added: ${stats.added}`);
  console.log(`   Files skipped: ${stats.skipped}`);
  console.log(`   Errors encountered: ${stats.errors}`);
  
  if (stats.added > 0) {
    console.log('\n🎉 Intent fields have been successfully added!');
  } else if (stats.skipped === stats.total) {
    console.log('\n✨ All files already have intent fields!');
  }
  
  if (stats.errors > 0) {
    console.log('\n⚠️  Some files had errors. Please check the output above.');
    process.exit(1);
  }
}

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  findJsonFiles,
  generateIntentFromPath,
  addIntentField,
  main
};
