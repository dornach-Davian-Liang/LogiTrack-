// ============================================================
// LogiTrack Pro - AI 数据分析问答 API 服务
// ============================================================

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: AiMessage[];
}

export interface ChatResponse {
  reply: string;
  functionCalled?: string;
  chartData?: string;       // JSON string of aggregated data (for charts)
  suggestions?: string[];
  error?: string;
}

const API_BASE_URL = '/api';

async function aiRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = localStorage.getItem('token');
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.username) {
        (headers as Record<string, string>)['X-User-Name'] = user.username;
      }
    } catch {
      // ignore
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new Error(`AI API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export const aiApi = {
  /**
   * 发送一条消息，返回 AI 回复
   */
  chat: (request: ChatRequest): Promise<ChatResponse> =>
    aiRequest<ChatResponse>('/ai/chat', request),

  /**
   * 健康检查
   */
  ping: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Accept': 'text/plain' };
      if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API_BASE_URL}/ai/ping`, { headers });
      return r.ok;
    } catch {
      return false;
    }
  },
};
