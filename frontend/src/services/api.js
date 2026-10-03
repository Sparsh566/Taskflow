const rawBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://taskflow-hz2k.onrender.com' : '');
const API_BASE = rawBase ? `${rawBase.replace(/\/+$/, '')}/api/v1` : '/api/v1';

let authToken = localStorage.getItem('taskflow_token') || '';

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('taskflow_token', token);
  } else {
    localStorage.removeItem('taskflow_token');
  }
};

export const getAuthToken = () => authToken;

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
};

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  loginWithGoogle: (data) =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  vaultAuth: (adminId, masterKey, accessPasscode = null) =>
    request('/vault-gateway-k7v/auth', {
      method: 'POST',
      body: JSON.stringify({
        admin_id: adminId,
        master_key: masterKey,
        access_passcode: accessPasscode,
      }),
    }),
  switchPersona: (email) =>
    request('/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  getMe: () => request('/auth/me'),

  // Users & Departments
  getUsers: (params = '') => request(`/users${params ? `?${params}` : ''}`),
  createUser: (data) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDepartments: () => request('/departments'),
  getCategories: (departmentId) => request(`/departments/${departmentId}/categories`),

  // Workspaces / Projects
  getWorkspaces: () => request('/workspaces'),
  createWorkspace: (data) =>
    request('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getWorkspace: (id) => request(`/workspaces/${id}`),
  addWorkspaceMember: (wsId, data) =>
    request(`/workspaces/${wsId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteWorkspace: (id) =>
    request(`/workspaces/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: (params = '') => request(`/tasks${params ? `?${params}` : ''}`),
  getTask: (taskId) => request(`/tasks/${taskId}`),
  createTask: (data) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (taskId, status, notes = '') =>
    request(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  reportBlocker: (taskId, reason) =>
    request(`/tasks/${taskId}/blocker`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  resolveBlocker: (taskId, blockerId) =>
    request(`/tasks/${taskId}/blocker/${blockerId}/resolve`, {
      method: 'PATCH',
    }),

  // Verification & Evidence
  submitEvidence: (taskId, data) =>
    request(`/tasks/${taskId}/submit-evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getVerificationSummary: (taskId) =>
    request(`/tasks/${taskId}/verification-summary`),
  reviewTask: (taskId, data) =>
    request(`/tasks/${taskId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // GitHub Simulation / Sync
  syncCommits: (taskId, commits) =>
    request(`/github/sync-commits/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(commits),
    }),
  getIntegrations: () => request('/github/integrations'),

  // Notifications & Analytics
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/notifications/mark-all-read', { method: 'PATCH' }),
  getDashboardAnalytics: () => request('/analytics/dashboard'),

  // Direct Chat & Messaging
  getChatConversations: () => request('/chat/conversations'),
  getChatMessages: (userId) => request(`/chat/messages/${userId}`),
  sendMessage: (data) =>
    request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markChatMessageRead: (id) =>
    request(`/chat/messages/${id}/read`, { method: 'POST' }),
  getChatUnreadCount: () => request('/chat/unread-count'),

  // Employee Dispute
  disputeTask: (taskId, reason, additionalEvidenceUrl = null) =>
    request(`/tasks/${taskId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({
        dispute_reason: reason,
        additional_evidence_url: additionalEvidenceUrl,
      }),
    }),

  // Admin Portal & Diagnostics
  getAdminUsers: () => request('/admin/users'),
  createAdminUser: (data) =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  updateUserStatus: (userId, isActive) =>
    request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),
  resetUserPassword: (userId, newPassword) =>
    request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    }),
  getAuditLogs: (limit = 50) => request(`/admin/audit-logs?limit=${limit}`),
  getDbHealth: () => request('/admin/db-health'),
  resetSandbox: () =>
    request('/admin/sandbox/reset', {
      method: 'POST',
    }),
};
