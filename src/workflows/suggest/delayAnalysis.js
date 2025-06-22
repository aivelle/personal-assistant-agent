// src/workflows/suggest/delayAnalysis.js
// 일정 지연 원인 분석 및 해결책 제안 워크플로우

const { GoogleClient } = require('../../integrations/google');
const { NotionClient } = require('../../integrations/notion');

/**
 * 일정 지연 상황을 분석하고 해결책을 제안하는 워크플로우
 */
async function delayAnalysis(context) {
  console.log('🔍 Starting delay analysis workflow...');
  
  try {
    const { user, parameters = {}, sessionManager } = context;
    const { current_tasks, deadline, delay_reasons } = parameters;
    
    // 사용자 토큰 가져오기
    const userTokens = await sessionManager.getUserTokens(user.id);
    if (!userTokens) {
      throw new Error('User authentication required');
    }

    // Google Calendar와 Notion 클라이언트 초기화
    const googleClient = new GoogleClient(userTokens.google_access_token);
    const notionClient = new NotionClient(userTokens.notion_access_token);

    // 1. 현재 일정 및 작업 분석
    const calendarEvents = await googleClient.getUpcomingEvents({
      timeMin: new Date().toISOString(),
      timeMax: deadline ? new Date(deadline).toISOString() : 
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
      maxResults: 50
    });

    // 2. Notion에서 현재 작업 상태 확인
    const notionTasks = await notionClient.queryDatabases({
      filter: {
        and: [
          {
            property: 'Status',
            select: {
              does_not_equal: 'Done'
            }
          },
          deadline ? {
            property: 'Due Date',
            date: {
              before: deadline
            }
          } : {}
        ].filter(Boolean)
      }
    });

    // 3. 지연 원인 분석
    const analysis = analyzeDelayFactors({
      calendarEvents: calendarEvents.items || [],
      notionTasks: notionTasks.results || [],
      userInput: { current_tasks, deadline, delay_reasons }
    });

    // 4. 해결책 제안
    const suggestions = generateSuggestions(analysis);

    // 5. 우선순위 작업 목록 생성
    const priorityTasks = generatePriorityTasks(analysis, suggestions);

    const result = {
      analysis: analysis,
      suggestions: suggestions,
      priority_tasks: priorityTasks,
      summary: {
        total_tasks: analysis.total_tasks,
        overdue_tasks: analysis.overdue_tasks,
        risk_level: analysis.risk_level,
        estimated_recovery_time: analysis.estimated_recovery_time
      }
    };

    console.log('✅ Delay analysis completed successfully');
    return {
      success: true,
      data: result,
      message: '일정 지연 분석이 완료되었습니다. 제안된 해결책을 확인해보세요.'
    };

  } catch (error) {
    console.error('❌ Delay analysis failed:', error);
    return {
      success: false,
      error: error.message,
      message: '일정 분석 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
}

/**
 * 지연 요인 분석
 */
function analyzeDelayFactors({ calendarEvents, notionTasks, userInput }) {
  const now = new Date();
  
  // 작업 분석
  const totalTasks = notionTasks.length;
  const overdueTasks = notionTasks.filter(task => {
    const dueDate = task.properties['Due Date']?.date?.start;
    return dueDate && new Date(dueDate) < now;
  }).length;

  // 일정 밀도 분석
  const upcomingEvents = calendarEvents.filter(event => 
    new Date(event.start.dateTime || event.start.date) > now
  );

  // 지연 원인 카테고리화
  const delayFactors = {
    time_management: {
      overcommitment: upcomingEvents.length > 10,
      poor_estimation: overdueTasks > totalTasks * 0.3,
      lack_of_buffer: true // 기본값
    },
    external_factors: {
      dependencies: userInput.delay_reasons?.includes('dependency') || false,
      resource_constraints: userInput.delay_reasons?.includes('resource') || false,
      scope_changes: userInput.delay_reasons?.includes('scope') || false
    },
    productivity_issues: {
      context_switching: upcomingEvents.length > 5,
      procrastination: overdueTasks > 0,
      distractions: true // 기본값
    }
  };

  // 위험도 계산
  const riskScore = calculateRiskScore({
    overdueTasks,
    totalTasks,
    upcomingEvents: upcomingEvents.length,
    delayFactors
  });

  return {
    total_tasks: totalTasks,
    overdue_tasks: overdueTasks,
    upcoming_events: upcomingEvents.length,
    delay_factors: delayFactors,
    risk_level: getRiskLevel(riskScore),
    risk_score: riskScore,
    estimated_recovery_time: calculateRecoveryTime(riskScore, overdueTasks),
    bottlenecks: identifyBottlenecks(calendarEvents, notionTasks)
  };
}

/**
 * 해결책 제안 생성
 */
function generateSuggestions(analysis) {
  const suggestions = [];

  // 시간 관리 개선
  if (analysis.delay_factors.time_management.overcommitment) {
    suggestions.push({
      category: 'time_management',
      title: '일정 재조정',
      description: '과도한 일정을 재조정하여 현실적인 스케줄을 만드세요.',
      priority: 'high',
      actions: [
        '중요하지 않은 회의 취소 또는 연기',
        '작업 시간 버퍼 20% 추가',
        '집중 시간 블록 설정'
      ]
    });
  }

  if (analysis.delay_factors.time_management.poor_estimation) {
    suggestions.push({
      category: 'time_management',
      title: '시간 추정 개선',
      description: '작업 시간을 더 정확하게 추정하는 방법을 적용하세요.',
      priority: 'medium',
      actions: [
        '과거 유사 작업 시간 참조',
        '작업을 더 작은 단위로 분해',
        '예상 시간의 1.5배로 계획'
      ]
    });
  }

  // 생산성 향상
  if (analysis.delay_factors.productivity_issues.context_switching) {
    suggestions.push({
      category: 'productivity',
      title: '집중 시간 확보',
      description: '컨텍스트 스위칭을 줄이고 깊은 집중 시간을 확보하세요.',
      priority: 'high',
      actions: [
        '2-3시간 연속 집중 블록 설정',
        '알림 차단 시간 지정',
        '유사한 작업들 배치 처리'
      ]
    });
  }

  // 우선순위 재정렬
  if (analysis.overdue_tasks > 0) {
    suggestions.push({
      category: 'prioritization',
      title: '우선순위 재정렬',
      description: '지연된 작업들의 우선순위를 재평가하고 조정하세요.',
      priority: 'high',
      actions: [
        '아이젠하워 매트릭스 적용',
        '데드라인 기준 재정렬',
        '불필요한 작업 제거'
      ]
    });
  }

  return suggestions;
}

/**
 * 우선순위 작업 목록 생성
 */
function generatePriorityTasks(analysis, suggestions) {
  const tasks = [];

  // 즉시 처리할 작업들
  if (analysis.overdue_tasks > 0) {
    tasks.push({
      priority: 1,
      title: '지연된 작업 즉시 처리',
      description: `${analysis.overdue_tasks}개의 지연된 작업을 우선 완료`,
      category: 'urgent',
      estimated_time: analysis.overdue_tasks * 2 + ' hours'
    });
  }

  // 일정 재조정
  if (analysis.risk_level === 'high') {
    tasks.push({
      priority: 2,
      title: '일정 전면 재검토',
      description: '현재 일정을 전면 재검토하고 현실적으로 조정',
      category: 'planning',
      estimated_time: '1-2 hours'
    });
  }

  // 시스템 개선
  tasks.push({
    priority: 3,
    title: '시간 관리 시스템 개선',
    description: '장기적인 시간 관리 개선을 위한 시스템 구축',
    category: 'improvement',
    estimated_time: '30 minutes daily'
  });

  return tasks;
}

/**
 * 위험도 점수 계산
 */
function calculateRiskScore({ overdueTasks, totalTasks, upcomingEvents, delayFactors }) {
  let score = 0;
  
  // 지연 작업 비율
  if (totalTasks > 0) {
    score += (overdueTasks / totalTasks) * 40;
  }
  
  // 일정 밀도
  if (upcomingEvents > 10) score += 30;
  else if (upcomingEvents > 5) score += 15;
  
  // 지연 요인들
  Object.values(delayFactors).forEach(category => {
    Object.values(category).forEach(factor => {
      if (factor) score += 5;
    });
  });

  return Math.min(score, 100);
}

/**
 * 위험도 레벨 결정
 */
function getRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * 복구 시간 계산
 */
function calculateRecoveryTime(riskScore, overdueTasks) {
  const baseTime = overdueTasks * 2; // 지연된 작업당 2시간
  const riskMultiplier = 1 + (riskScore / 100);
  return Math.round(baseTime * riskMultiplier) + ' hours';
}

/**
 * 병목 지점 식별
 */
function identifyBottlenecks(calendarEvents, notionTasks) {
  const bottlenecks = [];
  
  // 시간대별 일정 밀도 체크
  const hourlyLoad = {};
  calendarEvents.forEach(event => {
    const startHour = new Date(event.start.dateTime || event.start.date).getHours();
    hourlyLoad[startHour] = (hourlyLoad[startHour] || 0) + 1;
  });

  // 과밀 시간대 식별
  Object.entries(hourlyLoad).forEach(([hour, count]) => {
    if (count > 2) {
      bottlenecks.push({
        type: 'time_congestion',
        description: `${hour}시대 일정 과밀 (${count}개 이벤트)`,
        severity: count > 3 ? 'high' : 'medium'
      });
    }
  });

  return bottlenecks;
}

module.exports = {
  delayAnalysis,
  analyzeDelayFactors,
  generateSuggestions,
  generatePriorityTasks
}; 