/**
 * Chat Response Workflow
 * 사용자와의 자연스러운 대화를 처리하는 워크플로우
 */

/**
 * 대화형 응답 워크플로우 실행
 * @param {Object} context - 실행 컨텍스트
 * @returns {Object} - 응답 결과
 */
async function run(context) {
  const { input, intent, matchedTriggers, isFallback } = context;
  
  // 기본 인사말 응답
  const greetings = ['안녕하세요', '안녕', '하이', 'hi', 'hello'];
  const helpRequests = ['도움', '도와', '문의', '질문'];
  
  let response = {
    message: '',
    type: 'chat',
    suggestions: [],
    followUp: []
  };
  
  // 인사말 처리
  if (greetings.some(greeting => input.toLowerCase().includes(greeting.toLowerCase()))) {
    response.message = "안녕하세요! AIVELLE입니다. 어떤 도움이 필요하신가요?";
    response.suggestions = [
      "이메일을 써줘",
      "회의를 예약해줘", 
      "할 일을 추가해줘",
      "일정을 확인해줘"
    ];
  }
  // 도움 요청 처리
  else if (helpRequests.some(help => input.toLowerCase().includes(help.toLowerCase()))) {
    response.message = "무엇을 도와드릴까요? 다음과 같은 작업을 수행할 수 있습니다:";
    response.suggestions = [
      "📝 콘텐츠 작성 (이메일, 문서, 보고서)",
      "📅 일정 관리 (회의 예약, 리마인더 설정)",
      "✅ 작업 관리 (할 일 추가, 우선순위 정리)",
      "🔍 정보 검색 및 분석",
      "📊 데이터 요약 및 인사이트"
    ];
  }
  // Fallback 응답
  else if (isFallback) {
    response.message = `"${input}"에 대한 구체적인 작업을 찾지 못했습니다. 다음 중 하나를 시도해보세요:`;
    response.suggestions = [
      "더 구체적으로 말씀해 주세요",
      "이메일을 써줘",
      "회의를 예약해줘",
      "데이터를 분석해줘",
      "요약해줘"
    ];
  }
  // 일반 대화
  else {
    response.message = "네, 말씀해 주세요. 어떤 작업을 도와드릴까요?";
    response.suggestions = [
      "작업 계획을 세워줘",
      "우선순위를 정해줘",
      "일정을 확인해줘",
      "문서를 작성해줘"
    ];
  }
  
  // 후속 질문 추가
  response.followUp = [
    "다른 도움이 필요하시면 언제든 말씀해 주세요.",
    "구체적인 작업을 요청하시면 더 정확한 도움을 드릴 수 있습니다."
  ];
  
  return {
    success: true,
    response: response,
    metadata: {
      intent: intent,
      category: 'interact',
      matchedTriggers: matchedTriggers,
      isFallback: isFallback,
      timestamp: new Date().toISOString()
    }
  };
}

module.exports = {
  run,
  
  // Workflow 메타데이터
  metadata: {
    name: 'chatResponse',
    description: '사용자와의 자연스러운 대화 처리',
    category: 'interact',
    version: '1.0.0'
  }
}; 