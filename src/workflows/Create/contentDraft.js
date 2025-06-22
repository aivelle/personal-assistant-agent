/**
 * Content Draft Workflow
 * 콘텐츠 초안 작성을 처리하는 워크플로우
 */

/**
 * 콘텐츠 초안 작성 워크플로우 실행
 * @param {Object} context - 실행 컨텍스트
 * @returns {Object} - 작성 결과
 */
async function run(context) {
  const { input, intent, matchedTriggers } = context;
  
  // 콘텐츠 타입 분석
  const contentTypes = {
    email: ['이메일', '메일', 'email'],
    document: ['문서', '보고서', '제안서', 'document', 'report'],
    presentation: ['프레젠테이션', '발표', 'presentation', 'ppt'],
    memo: ['메모', '안건', '요약', 'memo', 'summary']
  };
  
  let detectedType = 'general';
  let typeKeyword = '';
  
  for (const [type, keywords] of Object.entries(contentTypes)) {
    for (const keyword of keywords) {
      if (input.toLowerCase().includes(keyword.toLowerCase())) {
        detectedType = type;
        typeKeyword = keyword;
        break;
      }
    }
    if (detectedType !== 'general') break;
  }
  
  // 콘텐츠 템플릿 생성
  let draft = {
    type: detectedType,
    title: '',
    content: '',
    structure: [],
    suggestions: []
  };
  
  switch (detectedType) {
    case 'email':
      draft.title = '이메일 초안';
      draft.content = `제목: [이메일 제목을 입력하세요]

안녕하세요,

[인사말 및 목적]

[주요 내용]
- 
- 
- 

[마무리 및 요청사항]

감사합니다.

[발신자 이름]`;
      
      draft.structure = [
        '제목 설정',
        '인사말 작성',
        '주요 내용 정리',
        '마무리 및 요청사항',
        '발신자 정보'
      ];
      
      draft.suggestions = [
        "구체적인 목적을 알려주시면 더 정확한 초안을 작성해드릴 수 있습니다",
        "수신자와 관계, 이메일 목적, 주요 내용을 추가로 알려주세요"
      ];
      break;
      
    case 'document':
      draft.title = '문서 초안';
      draft.content = `# [문서 제목]

## 1. 개요
[문서의 목적과 배경]

## 2. 주요 내용
### 2.1 [섹션 1]
[내용 1]

### 2.2 [섹션 2] 
[내용 2]

## 3. 결론 및 제안
[결론 및 다음 단계]

---
작성일: ${new Date().toLocaleDateString()}
작성자: [작성자명]`;
      
      draft.structure = [
        '문서 제목 설정',
        '개요 및 배경',
        '주요 내용 구성',
        '결론 및 제안',
        '메타데이터'
      ];
      
      draft.suggestions = [
        "문서의 구체적인 목적과 대상 독자를 알려주세요",
        "포함해야 할 주요 내용이나 데이터가 있다면 알려주세요"
      ];
      break;
      
    case 'presentation':
      draft.title = '프레젠테이션 초안';
      draft.content = `# [프레젠테이션 제목]

## 슬라이드 구성안

1. **표지**
   - 제목
   - 발표자
   - 날짜

2. **목차**
   - 주요 섹션 개요

3. **개요/배경**
   - 발표 목적
   - 배경 설명

4. **주요 내용** (3-5개 섹션)
   - 핵심 포인트 1
   - 핵심 포인트 2
   - 핵심 포인트 3

5. **결론**
   - 요약
   - 다음 단계

6. **Q&A**
   - 질의응답`;
      
      draft.structure = [
        '표지 슬라이드',
        '목차 구성',
        '배경 및 목적',
        '핵심 내용 (3-5개)',
        '결론 및 다음 단계',
        'Q&A 준비'
      ];
      
      draft.suggestions = [
        "발표 시간과 대상 청중을 알려주시면 더 적절한 구성을 제안해드릴 수 있습니다",
        "핵심 메시지나 전달하고 싶은 주요 포인트를 알려주세요"
      ];
      break;
      
    default:
      draft.title = '일반 콘텐츠 초안';
      draft.content = `# [제목을 입력하세요]

## 주요 내용
[여기에 주요 내용을 작성하세요]

- 포인트 1
- 포인트 2
- 포인트 3

## 결론
[결론 및 정리]`;
      
      draft.structure = [
        '제목 설정',
        '주요 내용 작성',
        '포인트 정리',
        '결론 도출'
      ];
      
      draft.suggestions = [
        "어떤 종류의 콘텐츠인지 구체적으로 알려주세요 (이메일, 문서, 보고서 등)",
        "목적과 대상 독자를 알려주시면 더 맞춤형 초안을 작성해드릴 수 있습니다"
      ];
  }
  
  return {
    success: true,
    draft: draft,
    analysis: {
      detectedType: detectedType,
      typeKeyword: typeKeyword,
      matchedTriggers: matchedTriggers
    },
    nextSteps: [
      "초안을 검토하고 필요한 부분을 수정해주세요",
      "구체적인 내용을 추가로 요청하시면 더 상세한 초안을 작성해드릴 수 있습니다",
      "완성된 초안은 저장하거나 다른 형식으로 변환할 수 있습니다"
    ],
    metadata: {
      intent: intent,
      category: 'create',
      timestamp: new Date().toISOString(),
      wordCount: draft.content.length
    }
  };
}

module.exports = {
  run,
  
  // Workflow 메타데이터
  metadata: {
    name: 'contentDraft',
    description: '다양한 콘텐츠의 초안 작성',
    category: 'create',
    version: '1.0.0',
    supportedTypes: ['email', 'document', 'presentation', 'memo']
  }
}; 