#!/usr/bin/env node

// scripts/test-flow-manager.js
// Flow Manager 기능을 테스트하는 스크립트

const path = require('path');

// Flow Manager 로드
const flowManager = require('../src/core/flow-manager');

/**
 * Flow Manager 상태 확인
 */
async function testStatus() {
  console.log('🔍 Testing Flow Manager Status...');
  
  const status = flowManager.getStatus();
  console.log('Status:', JSON.stringify(status, null, 2));
  
  if (status.status === 'ready') {
    console.log('✅ Flow Manager is ready\n');
    return true;
  } else {
    console.log('❌ Flow Manager has issues\n');
    return false;
  }
}

/**
 * Intent 목록 확인
 */
async function testAvailableIntents() {
  console.log('📋 Testing Available Intents...');
  
  const intents = flowManager.getAvailableIntents();
  console.log(`Found ${intents.length} available intents:`);
  
  intents.slice(0, 5).forEach(intent => {
    console.log(`  - ${intent.intent} (${intent.category}) - ${intent.title}`);
  });
  
  if (intents.length > 5) {
    console.log(`  ... and ${intents.length - 5} more`);
  }
  
  console.log('✅ Intent listing works\n');
  return intents.length > 0;
}

/**
 * Intent 매칭 테스트
 */
async function testIntentMatching() {
  console.log('🎯 Testing Intent Matching...');
  
  const testCases = [
    "이메일을 써줘",
    "회의를 예약해줘", 
    "안녕하세요",
    "알 수 없는 입력"
  ];
  
  for (const testInput of testCases) {
    const match = flowManager.matchIntent(testInput);
    console.log(`Input: "${testInput}"`);
    
    if (match) {
      console.log(`  ✅ Matched: ${match.intent} (score: ${match.score})`);
      if (match.matchedTriggers.length > 0) {
        console.log(`  Triggers: ${match.matchedTriggers.join(', ')}`);
      }
    } else {
      console.log(`  ❌ No match`);
    }
    console.log('');
  }
  
  console.log('✅ Intent matching test completed\n');
}

/**
 * 사용자 입력 처리 테스트
 */
async function testUserInputHandling() {
  console.log('🚀 Testing User Input Handling...');
  
  const testInputs = [
    "이메일을 써줘",
    "트렌드를 분석해줘",
    "안녕하세요"
  ];
  
  for (const input of testInputs) {
    console.log(`Testing: "${input}"`);
    
    try {
      const result = await flowManager.handleUserInput(input);
      
      console.log(`  Intent: ${result.intent}`);
      console.log(`  Success: ${result.success}`);
      console.log(`  Category: ${result.category}`);
      console.log(`  Title: ${result.title}`);
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
        console.log(`  Message: ${result.result}`);
      } else {
        console.log(`  Result: ${JSON.stringify(result.result, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('✅ User input handling test completed\n');
}

/**
 * 카테고리별 Intent 테스트
 */
async function testCategoryIntents() {
  console.log('📂 Testing Category-based Intent Retrieval...');
  
  const categories = ['create', 'suggest', 'interact'];
  
  for (const category of categories) {
    const intents = flowManager.getIntentsByCategory(category);
    console.log(`${category}: ${intents.length} intents`);
    
    intents.forEach(intent => {
      console.log(`  - ${intent.intent}: ${intent.title}`);
    });
    console.log('');
  }
  
  console.log('✅ Category-based intent retrieval test completed\n');
}

/**
 * 에러 처리 테스트
 */
async function testErrorHandling() {
  console.log('🛠️ Testing Error Handling...');
  
  // 빈 입력 테스트
  const emptyResult = await flowManager.handleUserInput('');
  console.log('Empty input result:', {
    success: emptyResult.success,
    error: emptyResult.error,
    message: emptyResult.message
  });
  
  // null 입력 테스트
  const nullResult = await flowManager.handleUserInput(null);
  console.log('Null input result:', {
    success: nullResult.success,
    error: nullResult.error,
    message: nullResult.message
  });
  
  console.log('✅ Error handling test completed\n');
}

/**
 * 메인 테스트 실행
 */
async function main() {
  console.log('🧪 Flow Manager Test Suite\n');
  
  try {
    // 기본 상태 확인
    const statusOk = await testStatus();
    if (!statusOk) {
      console.log('❌ Flow Manager is not ready. Exiting...');
      process.exit(1);
    }
    
    // 각종 테스트 실행
    await testAvailableIntents();
    await testIntentMatching();
    await testCategoryIntents();
    await testErrorHandling();
    await testUserInputHandling();
    
    console.log('🎉 All Flow Manager tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  testStatus,
  testAvailableIntents,
  testIntentMatching,
  testUserInputHandling,
  testCategoryIntents,
  testErrorHandling,
  main
}; 