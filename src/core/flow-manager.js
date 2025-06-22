/**
 * Flow Manager - AIVELLE Core Component
 * 
 * Step 1: 사용자의 입력으로부터 intent를 판별
 * Step 2: rules/routing-rules.json에서 해당 intent의 code 경로 가져오기
 * Step 3: require()로 해당 workflow 실행
 */

const fs = require('fs');
const path = require('path');

/**
 * 라우팅 규칙을 로드합니다 (캐싱 포함)
 */
let routingRulesCache = null;
function loadRoutingRules() {
  if (routingRulesCache) {
    return routingRulesCache;
  }
  
  const routingRulesPath = path.join(__dirname, '../../rules/routing-rules.json');
  
  if (!fs.existsSync(routingRulesPath)) {
    throw new Error('Routing rules not found. Run: node scripts/generate-routing-rules.js');
  }
  
  try {
    const content = fs.readFileSync(routingRulesPath, 'utf8');
    routingRulesCache = JSON.parse(content);
    return routingRulesCache;
  } catch (error) {
    throw new Error(`Failed to load routing rules: ${error.message}`);
  }
}

/**
 * 사용자 입력에 대해 intent를 매칭합니다
 * @param {string} userInput - 사용자 입력
 * @returns {Object|null} - 매칭된 intent 정보 또는 null
 */
function matchIntent(userInput) {
  const routingRules = loadRoutingRules();
  const { rules, fallback_intent } = routingRules.routing;
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
  
  // 매칭된 것이 있으면 최고 점수 반환, 없으면 fallback
  if (matches.length > 0) {
    return matches[0];
  }
  
  // Fallback intent 반환
  if (rules[fallback_intent]) {
    return {
      intent: fallback_intent,
      rule: rules[fallback_intent],
      score: 0,
      matchedTriggers: [],
      priority: rules[fallback_intent].priority,
      isFallback: true
    };
  }
  
  return null;
}

/**
 * Workflow 파일을 동적으로 로드하고 실행합니다
 * @param {string} workflowPath - Workflow 파일 경로
 * @param {Object} context - 실행 컨텍스트
 * @returns {Object} - Workflow 실행 결과
 */
async function executeWorkflow(workflowPath, context) {
  try {
    // 절대 경로로 변환
    const absolutePath = path.resolve(__dirname, '..', workflowPath.replace('src/', ''));
    
    // 파일 존재 확인
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️  Workflow file not found: ${absolutePath}`);
      
      // 기본 응답 생성
      return {
        success: false,
        error: 'WORKFLOW_NOT_FOUND',
        message: `Workflow implementation not found: ${workflowPath}`,
        suggestion: 'This workflow is planned but not yet implemented.',
        context: context
      };
    }
    
    // Workflow 모듈 로드
    delete require.cache[require.resolve(absolutePath)]; // 캐시 무효화
    const workflow = require(absolutePath);
    
    // Workflow 실행
    if (typeof workflow.run === 'function') {
      const result = await workflow.run(context);
      return {
        success: true,
        result: result,
        workflowPath: workflowPath
      };
    } else if (typeof workflow === 'function') {
      const result = await workflow(context);
      return {
        success: true,
        result: result,
        workflowPath: workflowPath
      };
    } else {
      throw new Error('Workflow must export a "run" function or be a function itself');
    }
    
  } catch (error) {
    console.error(`❌ Error executing workflow ${workflowPath}:`, error);
    
    return {
      success: false,
      error: 'WORKFLOW_EXECUTION_ERROR',
      message: error.message,
      workflowPath: workflowPath,
      context: context
    };
  }
}

/**
 * 사용자 입력을 기반으로 매칭되는 workflow 실행
 * @param {string} userInput - 사용자 입력
 * @param {Object} options - 추가 옵션
 * @returns {Object} - 실행 결과
 */
async function handleUserInput(userInput, options = {}) {
  try {
    // 입력 검증
    if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: 'User input is required and must be a non-empty string'
      };
    }
    
    // Intent 매칭
    const match = matchIntent(userInput.trim());
    
    if (!match) {
      return {
        success: false,
        error: 'NO_INTENT_MATCHED',
        message: 'No matching workflow found for the input',
        input: userInput
      };
    }
    
    // 실행 컨텍스트 생성
    const context = {
      input: userInput,
      intent: match.intent,
      matchedTriggers: match.matchedTriggers,
      score: match.score,
      isFallback: match.isFallback || false,
      rule: match.rule,
      timestamp: new Date().toISOString(),
      ...options
    };
    
    // Workflow 실행
    const workflowResult = await executeWorkflow(match.rule.paths.code, context);
    
    return {
      success: workflowResult.success,
      intent: match.intent,
      category: match.rule.category,
      title: match.rule.title,
      description: match.rule.description,
      matchedTriggers: match.matchedTriggers,
      score: match.score,
      isFallback: match.isFallback || false,
      workflowPath: match.rule.paths.code,
      scenarioPath: match.rule.paths.scenario,
      result: workflowResult.result || workflowResult.message,
      error: workflowResult.error,
      executionTime: Date.now(),
      context: context
    };
    
  } catch (error) {
    console.error('❌ Error in handleUserInput:', error);
    
    return {
      success: false,
      error: 'FLOW_MANAGER_ERROR',
      message: error.message,
      input: userInput,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 사용 가능한 모든 intents 목록을 반환합니다
 * @returns {Array} - Intent 목록
 */
function getAvailableIntents() {
  try {
    const routingRules = loadRoutingRules();
    const { rules } = routingRules.routing;
    
    return Object.keys(rules)
      .filter(intentKey => rules[intentKey].enabled)
      .map(intentKey => ({
        intent: intentKey,
        category: rules[intentKey].category,
        title: rules[intentKey].title,
        description: rules[intentKey].description,
        triggers: rules[intentKey].triggers,
        priority: rules[intentKey].priority
      }))
      .sort((a, b) => b.priority - a.priority);
      
  } catch (error) {
    console.error('❌ Error getting available intents:', error);
    return [];
  }
}

/**
 * 특정 카테고리의 intents를 반환합니다
 * @param {string} category - 카테고리명
 * @returns {Array} - 해당 카테고리의 Intent 목록
 */
function getIntentsByCategory(category) {
  const allIntents = getAvailableIntents();
  return allIntents.filter(intent => intent.category === category);
}

/**
 * 라우팅 규칙 캐시를 무효화합니다
 */
function clearCache() {
  routingRulesCache = null;
}

/**
 * Flow Manager 상태 정보를 반환합니다
 * @returns {Object} - 상태 정보
 */
function getStatus() {
  try {
    const routingRules = loadRoutingRules();
    const { metadata, routing } = routingRules;
    const enabledRules = Object.values(routing.rules).filter(rule => rule.enabled);
    
    return {
      version: metadata.version,
      generated: metadata.generated,
      totalScenarios: metadata.total_scenarios,
      enabledScenarios: enabledRules.length,
      categories: metadata.categories,
      fallbackIntent: routing.fallback_intent,
      cacheLoaded: !!routingRulesCache,
      status: 'ready'
    };
    
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      cacheLoaded: false
    };
  }
}

module.exports = {
  handleUserInput,
  matchIntent,
  getAvailableIntents,
  getIntentsByCategory,
  getStatus,
  clearCache,
  loadRoutingRules,
  executeWorkflow
}; 