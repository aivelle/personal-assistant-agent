const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const LOG_COLORS = {
  DEBUG: '\x1b[36m', // 청록색
  INFO: '\x1b[32m',  // 녹색
  WARN: '\x1b[33m',  // 노란색
  ERROR: '\x1b[31m', // 빨간색
  FATAL: '\x1b[35m', // 보라색
  RESET: '\x1b[0m'   // 리셋
};

class Logger {
  constructor() {
    this.logLevel = LOG_LEVELS.INFO;
    this.isDevelopment = false; // Cloudflare Workers에서는 항상 false
  }

  setLogLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.logLevel = LOG_LEVELS[level];
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const requestId = meta.requestId || 'NO_REQUEST_ID';
    const userId = meta.userId || 'NO_USER';
    
    return {
      timestamp,
      level,
      requestId,
      userId,
      message,
      ...meta
    };
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= this.logLevel;
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedLog = this.formatMessage(level, message, meta);
    
    // Cloudflare Workers에서는 항상 JSON 형식으로 출력
    console.log(JSON.stringify(formattedLog));
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  fatal(message, meta = {}) {
    this.log('FATAL', message, meta);
  }

  // OAuth 전용 로깅 메소드
  oauthLog(status, message, meta = {}) {
    const level = status === 'success' ? 'INFO' : 'ERROR';
    this.log(level, `[OAuth] ${message}`, {
      ...meta,
      oauth_status: status
    });
  }

  // API 요청 로깅
  apiRequest(method, path, meta = {}) {
    this.info(`API Request: ${method} ${path}`, {
      ...meta,
      http_method: method,
      path
    });
  }

  // 성능 메트릭 로깅
  logMetric(name, value, meta = {}) {
    this.info(`Metric: ${name} = ${value}`, {
      ...meta,
      metric_name: name,
      metric_value: value
    });
  }
}

// 싱글톤 인스턴스 생성
const logger = new Logger();

export default logger; 