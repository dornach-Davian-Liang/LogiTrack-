/**
 * Settings API 服务
 * 包括审计日志、主数据管理等设置相关的API调用
 */

export interface AuditLogFilter {
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  username?: string;
  action?: string;
  resourceType?: string;
}

export interface AuditLogItem {
  id: number;
  createdAt: string;
  username: string;
  action: string;
  resourceType: string;
  resourceName?: string;
  resourceId?: string;
  status: string;
  oldValue?: string;
  newValue?: string;
}

export interface AuditLogResponse {
  content: AuditLogItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface UserItem {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  roleCodes?: string[];
  roleNames?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleOption {
  roleCode: string;
  roleName: string;
}

/**
 * 通用请求方法
 */
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.username) {
        (defaultHeaders as any)['X-Username'] = user.username;
      }
      if (user.roles && user.roles.length > 0) {
        (defaultHeaders as any)['X-User-Role'] = user.roles[0];
      }
    } catch (e) {
      console.warn('[settingsApi] Failed to parse user info:', e);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export const settingsApi = {
  /**
   * 获取审计日志列表
   */
  getAuditLogs: async (filters: AuditLogFilter): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page !== undefined) params.append('page', String(filters.page));
    if (filters.size !== undefined) params.append('size', String(filters.size));
    if (filters.startDate) params.append('startTime', filters.startDate);
    if (filters.endDate) params.append('endTime', filters.endDate);
    if (filters.username) params.append('username', filters.username);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);

    const url = `/api/audit-logs?${params.toString()}`;
    console.log('[settingsApi] Fetching audit logs from:', url);
    
    const response = await request<AuditLogResponse>(url);
    return response;
  },

  /**
   * 获取资源操作历史
   */
  getResourceHistory: async (resourceType: string, resourceId: string): Promise<AuditLogItem[]> => {
    const url = `/api/audit-logs/resource-history?resourceType=${resourceType}&resourceId=${resourceId}`;
    const response = await request<AuditLogItem[]>(url);
    return response;
  },

  /**
   * 获取用户操作日志
   */
  getUserLogs: async (userId: number, page: number = 0, size: number = 20): Promise<AuditLogResponse> => {
    const url = `/api/audit-logs/user/${userId}?page=${page}&size=${size}`;
    const response = await request<AuditLogResponse>(url);
    return response;
  },

  /**
   * 导出审计日志
   */
  exportAuditLogs: async (filters: AuditLogFilter): Promise<void> => {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startTime', filters.startDate);
    if (filters.endDate) params.append('endTime', filters.endDate);
    if (filters.username) params.append('username', filters.username);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);

    const url = `/api/audit-logs/export?${params.toString()}`;
    console.log('[settingsApi] Exporting audit logs from:', url);
    
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const extraHeaders: Record<string, string> = {};
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.username) {
            extraHeaders['X-Username'] = user.username;
          }
          if (user.roles && user.roles.length > 0) {
            extraHeaders['X-User-Role'] = user.roles[0];
          }
        } catch (e) {
          console.warn('[settingsApi] Failed to parse user info for export:', e);
        }
      }
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ...extraHeaders,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // 创建blob并下载
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw error;
    }
  },

  /**
   * 清空审计日志
   */
  clearAuditLogs: async (): Promise<void> => {
    const url = '/api/audit-logs/clear';
    console.log('[settingsApi] Clearing audit logs from:', url);
    
    const response = await request<{ message: string }>(url, {
      method: 'POST',
    });
    console.log('[settingsApi] Clear response:', response);
  },

  /**
   * 获取用户列表
   */
  getUsers: async (includeInactive: boolean = false): Promise<UserItem[]> => {
    const url = `/api/users?includeInactive=${includeInactive}`;
    return request<UserItem[]>(url);
  },

  /**
   * 获取角色列表
   */
  getRoles: async (): Promise<RoleOption[]> => {
    const url = '/api/users/roles';
    return request<RoleOption[]>(url);
  },

  /**
   * 创建用户
   */
  createUser: async (payload: Record<string, any>): Promise<UserItem> => {
    const url = '/api/users';
    return request<UserItem>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 更新用户
   */
  updateUser: async (id: number, payload: Record<string, any>): Promise<UserItem> => {
    const url = `/api/users/${id}`;
    return request<UserItem>(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 禁用用户（软删除）
   */
  deleteUser: async (id: number): Promise<{ message: string }> => {
    const url = `/api/users/${id}`;
    return request<{ message: string }>(url, {
      method: 'DELETE',
    });
  },

  /**
   * 重置用户密码
   */
  resetUserPassword: async (id: number): Promise<{ message: string; temporaryPassword: string }> => {
    const url = `/api/users/${id}/reset-password`;
    return request<{ message: string; temporaryPassword: string }>(url, {
      method: 'POST',
    });
  }
};

export default settingsApi;
