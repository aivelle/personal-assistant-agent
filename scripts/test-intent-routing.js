#!/usr/bin/env node

// scripts/test-intent-routing.js
// Intent 라우팅 시스템을 테스트하는 스크립트

const fs = require('fs');
const path = require('path');

/**
 * 라우팅 규칙을 로드합니다
 * @returns {Object|null} - 라우팅 규칙 객체 또는 null
 */
function loadRoutingRules() {
  const routingRulesPath = path.join(process.cwd(), 'rules', 'routing-rules.json');
  
  if (!fs.existsSync(routingRulesPath)) {
    console.error('❌ Error: routing-rules.json not found');
    console.log('   Run: node scripts/generate-routing-rules.js');
    return null;
  }
  
  try {
    const content = fs.readFileSync(routingRulesPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error loading routing rules:', error.message);
    return null;
  }
}

/**
 * 사용자 입력에 대해 intent를 매칭합니다
 * @param {string} userInput - 사용자 입력
 * @param {Object} routingRules - 라우팅 규칙
 * @returns {Object|null} - 매칭된 intent 정보 또는 null
 */
function matchIntent(userInput, routingRules) {
  const { rules } = routingRules.routing;
  const matches = [];
  
  // 모든 규칙에 대해 매칭 점수 계산
  for (const [intentKey, rule] of Object.entries(rules)) {
    if (!rule.enabled) continue;
    
    let score = 0;
    let matchedTriggers = [];
    
    // 트리거 키워드 매칭
    for (const trigger of rule.triggers) {
      if (userInput.toLowerCase().includes(trigger.toLowerCase())) {
        score += 10;
        matchedTriggers.push(trigger);
      }
    }
    
    // 예시 문장과의 유사도 체크 (간단한 키워드 매칭)
    for (const example of rule.examples) {
      const exampleWords = example.toLowerCase().split(/\s+/);
      const inputWords = userInput.toLowerCase().split(/\s+/);
      
      let commonWords = 0;
      for (const word of inputWords) {
        if (exampleWords.includes(word) && word.length > 2) {
          commonWords++;
        }
      }
      
      if (commonWords > 0) {
        score += commonWords * 2;
      }
    }
    
    // 카테고리명이 포함된 경우 보너스
    if (userInput.toLowerCase().includes(rule.category.toLowerCase())) {
      score += 5;
    }
    
    if (score > 0) {
      matches.push({
        intent: intentKey,
        rule: rule,
        score: score,
        matchedTriggers: matchedTriggers,
        priority: rule.priority
      });
    }
  }
  
  // 점수와 우선순위로 정렬
  matches.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // 점수 높은 순
    }
    return b.priority - a.priority; // 우선순위 높은 순
  });
  
  return matches.length > 0 ? matches[0] : null;
}

/**
 * 단일 테스트를 실행합니다
 * @param {string} userInput - 사용자 입력
 * @param {string} expectedIntent - 예상되는 intent
 * @param {Object} routingRules - 라우팅 규칙
 * @returns {Object} - 테스트 결과
 */
function runSingleTest(userInput, expectedIntent, routingRules) {
  const match = matchIntent(userInput, routingRules);
  
  const result = {
    input: userInput,
    expected: expectedIntent,
    actual: match ? match.intent : 'no-match',
    success: match && match.intent === expectedIntent,
    score: match ? match.score : 0,
    matchedTriggers: match ? match.matchedTriggers : [],
    allMatches: []
  };
  
  // 상위 3개 매치 결과도 포함
  const allMatches = [];
  for (const [intentKey, rule] of Object.entries(routingRules.routing.rules)) {
    if (!rule.enabled) continue;
    
    let score = 0;
    for (const trigger of rule.triggers) {
      if (userInput.toLowerCase().includes(trigger.toLowerCase())) {
        score += 10;
      }
    }
    
    if (score > 0) {
      allMatches.push({ intent: intentKey, score });
    }
  }
  
  result.allMatches = allMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  return result;
}

/**
 * 테스트 케이스들을 정의합니다
 * @returns {Array} - 테스트 케이스 배열
 */
function getTestCases() {
  return [
    // Create 카테고리
    {
      input: "이메일을 써줘",
      expected: "create.contentDraft"
    },
    {
      input: "새 프로젝트를 시작해야 해",
      expected: "create.taskPlan"
    },
    {
      input: "회의를 예약해줘",
      expected: "create.meeting"
    },
    {
      input: "할 일을 추가해줘",
      expected: "create.task"
    },
    {
      input: "내일 미팅 리마인더 설정해줘",
      expected: "create.reminder"
    },
    
    // Suggest 카테고리
    {
      input: "일이 밀렸어",
      expected: "suggest.delayAnalysis"
    },
    {
      input: "더 효율적으로 일하고 싶어",
      expected: "suggest.productivityTip"
    },
    {
      input: "일정을 바꿔줘",
      expected: "suggest.rescheduleOption"
    },
    
    // Manage 카테고리
    {
      input: "우선순위를 정해줘",
      expected: "manage.prioritySort"
    },
    {
      input: "상태를 업데이트해줘",
      expected: "manage.statusUpdate"
    },
    
    // Remind 카테고리
    {
      input: "데드라인을 알려줘",
      expected: "remind.deadlineAlert"
    },
    {
      input: "후속 조치를 확인해줘",
      expected: "remind.followUp"
    },
    
    // Retrieve 카테고리
    {
      input: "찾아줘",
      expected: "retrieve.dataSearch"
    },
    {
      input: "지난달 회의록을 검색해줘",
      expected: "retrieve.dataSearch"
    },
    
    // Summarize 카테고리
    {
      input: "요약해줘",
      expected: "summarize.reportSummary"
    },
    {
      input: "이 보고서의 핵심 내용을 정리해줘",
      expected: "summarize.reportSummary"
    },
    
    // Insight 카테고리
    {
      input: "트렌드를 분석해줘",
      expected: "insight.trendAnalysis"
    },
    
    // Interact 카테고리 (fallback)
    {
      input: "안녕하세요",
      expected: "interact.chatResponse"
    },
    {
      input: "도움이 필요해요",
      expected: "interact.chatResponse"
    }
  ];
}

/**
 * 모든 테스트를 실행하고 결과를 출력합니다
 * @param {Object} routingRules - 라우팅 규칙
 */
function runAllTests(routingRules) {
  const testCases = getTestCases();
  const results = [];
  
  console.log('🧪 Running Intent Routing Tests...\n');
  
  for (const testCase of testCases) {
    const result = runSingleTest(testCase.input, testCase.expected, routingRules);
    results.push(result);
    
    // 개별 테스트 결과 출력
    const status = result.success ? '✅' : '❌';
    console.log(`${status} "${result.input}"`);
    console.log(`   Expected: ${result.expected}`);
    console.log(`   Actual: ${result.actual} (score: ${result.score})`);
    
    if (result.matchedTriggers.length > 0) {
      console.log(`   Matched triggers: ${result.matchedTriggers.join(', ')}`);
    }
    
    if (!result.success && result.allMatches.length > 0) {
      console.log(`   Top matches: ${result.allMatches.map(m => `${m.intent}(${m.score})`).join(', ')}`);
    }
    
    console.log('');
  }
  
  // 전체 결과 통계
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log('📊 Test Results Summary:');
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success rate: ${successRate}%`);
  
  // 실패한 테스트들 상세 분석
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests Analysis:');
    const failedResults = results.filter(r => !r.success);
    
    for (const failed of failedResults) {
      console.log(`   "${failed.input}"`);
      console.log(`     Expected: ${failed.expected}`);
      console.log(`     Got: ${failed.actual}`);
      
      if (failed.actual === 'no-match') {
        console.log('     Issue: No intent matched - consider adding more triggers');
      } else {
        console.log('     Issue: Wrong intent matched - check trigger specificity');
      }
    }
  }
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: parseFloat(successRate),
    results
  };
}

/**
 * 대화형 테스트 모드를 실행합니다
 * @param {Object} routingRules - 라우팅 규칙
 */
function runInteractiveMode(routingRules) {
  console.log('🎯 Interactive Intent Testing Mode');
  console.log('Enter user inputs to test intent matching (type "exit" to quit):\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askInput = () => {
    rl.question('👤 User input: ', (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('👋 Goodbye!');
        rl.close();
        return;
      }
      
      if (input.trim() === '') {
        askInput();
        return;
      }
      
      const match = matchIntent(input, routingRules);
      
      if (match) {
        console.log(`🎯 Matched Intent: ${match.intent}`);
        console.log(`   Category: ${match.rule.category}`);
        console.log(`   Title: ${match.rule.title}`);
        console.log(`   Score: ${match.score}`);
        console.log(`   Priority: ${match.priority}`);
        
        if (match.matchedTriggers.length > 0) {
          console.log(`   Triggers: ${match.matchedTriggers.join(', ')}`);
        }
        
        console.log(`   Scenario: ${match.rule.paths.scenario}`);
        console.log(`   Code: ${match.rule.paths.code}`);
      } else {
        console.log('❌ No intent matched');
        console.log('   This would fall back to: interact.chatResponse');
      }
      
      console.log('');
      askInput();
    });
  };
  
  askInput();
}

/**
 * 메인 실행 함수
 */
function main() {
  const args = process.argv.slice(2);
  const isInteractive = args.includes('--interactive') || args.includes('-i');
  
  console.log('🚀 Intent Routing Test Suite\n');
  
  // 라우팅 규칙 로드
  const routingRules = loadRoutingRules();
  if (!routingRules) {
    process.exit(1);
  }
  
  console.log(`📋 Loaded ${Object.keys(routingRules.routing.rules).length} routing rules`);
  console.log(`🎯 Fallback intent: ${routingRules.routing.fallback_intent}\n`);
  
  if (isInteractive) {
    runInteractiveMode(routingRules);
  } else {
    const testResults = runAllTests(routingRules);
    
    // 성공률이 낮으면 종료 코드 1로 종료
    if (testResults.successRate < 80) {
      console.log('\n⚠️  Success rate is below 80%. Consider improving triggers or test cases.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  }
}

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  loadRoutingRules,
  matchIntent,
  runSingleTest,
  runAllTests,
  main
}; 