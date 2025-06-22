// src/integrations/notion.js
// Notion API 연동 클라이언트

/**
 * Notion API 클라이언트
 * 데이터베이스 조회, 페이지 생성/수정, 워크스페이스 분석 기능 제공
 */
class NotionClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.notion.com/v1';
    this.version = '2022-06-28';
  }

  /**
   * API 요청 헬퍼 메서드
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': this.version,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`Notion API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Notion API request failed:', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUser() {
    return await this.request('/users/me');
  }

  /**
   * 데이터베이스 목록 조회
   */
  async getDatabases() {
    return await this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          value: 'database',
          property: 'object'
        }
      })
    });
  }

  /**
   * 데이터베이스 쿼리
   */
  async queryDatabases(databaseId, query = {}) {
    if (typeof databaseId === 'object') {
      // databaseId가 객체인 경우 (query 파라미터만 전달된 경우)
      query = databaseId;
      // 기본 데이터베이스 검색
      const databases = await this.getDatabases();
      const taskDb = databases.results.find(db => 
        db.title?.[0]?.plain_text?.toLowerCase().includes('task') ||
        db.title?.[0]?.plain_text?.toLowerCase().includes('할일')
      );
      
      if (!taskDb) {
        throw new Error('Task database not found');
      }
      databaseId = taskDb.id;
    }

    return await this.request(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(query)
    });
  }

  /**
   * 페이지 생성
   */
  async createPage(databaseId, properties, content = []) {
    const body = {
      parent: { database_id: databaseId },
      properties: properties
    };

    if (content.length > 0) {
      body.children = content;
    }

    return await this.request('/pages', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * 페이지 업데이트
   */
  async updatePage(pageId, properties) {
    return await this.request(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });
  }

  /**
   * 페이지 조회
   */
  async getPage(pageId) {
    return await this.request(`/pages/${pageId}`);
  }

  /**
   * 워크스페이스 분석 - 데이터베이스 카테고리화
   */
  async analyzeWorkspace() {
    const databases = await this.getDatabases();
    const analysis = {
      total_databases: databases.results.length,
      categories: {
        tasks: [],
        projects: [],
        calendar: [],
        notes: [],
        other: []
      }
    };

    databases.results.forEach(db => {
      const title = db.title?.[0]?.plain_text?.toLowerCase() || '';
      
      if (title.includes('task') || title.includes('할일') || title.includes('todo')) {
        analysis.categories.tasks.push(db);
      } else if (title.includes('project') || title.includes('프로젝트')) {
        analysis.categories.projects.push(db);
      } else if (title.includes('calendar') || title.includes('일정') || title.includes('캘린더')) {
        analysis.categories.calendar.push(db);
      } else if (title.includes('note') || title.includes('노트') || title.includes('메모')) {
        analysis.categories.notes.push(db);
      } else {
        analysis.categories.other.push(db);
      }
    });

    return analysis;
  }

  /**
   * 작업 상태 분석
   */
  async analyzeTaskStatus(databaseId = null) {
    let query = {};
    
    if (!databaseId) {
      const workspace = await this.analyzeWorkspace();
      if (workspace.categories.tasks.length === 0) {
        throw new Error('No task database found');
      }
      databaseId = workspace.categories.tasks[0].id;
    }

    const tasks = await this.queryDatabases(databaseId);
    const analysis = {
      total: tasks.results.length,
      by_status: {},
      overdue: [],
      upcoming: []
    };

    const now = new Date();
    
    tasks.results.forEach(task => {
      // 상태 분석
      const status = task.properties.Status?.select?.name || 'Unknown';
      analysis.by_status[status] = (analysis.by_status[status] || 0) + 1;

      // 마감일 분석
      const dueDate = task.properties['Due Date']?.date?.start;
      if (dueDate) {
        const due = new Date(dueDate);
        if (due < now && status !== 'Done') {
          analysis.overdue.push(task);
        } else if (due > now && due < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          analysis.upcoming.push(task);
        }
      }
    });

    return analysis;
  }

  /**
   * 프로퍼티 매핑 분석
   */
  async getDatabaseProperties(databaseId) {
    const database = await this.request(`/databases/${databaseId}`);
    const properties = {};
    
    Object.entries(database.properties).forEach(([key, prop]) => {
      properties[key] = {
        type: prop.type,
        name: key,
        config: prop[prop.type] || {}
      };
    });

    return properties;
  }

  /**
   * 검색
   */
  async search(query, filter = {}) {
    const body = { query };
    if (Object.keys(filter).length > 0) {
      body.filter = filter;
    }

    return await this.request('/search', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
}

module.exports = { NotionClient }; 