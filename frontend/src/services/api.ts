/**
 * Enterprise API Service Layer
 * 
 * Configured with `credentials: 'include'` for secure HttpOnly cookie session management:
 * - Passwords and raw tokens are never persisted in localStorage or client storage
 * - Protection against XSS-based token theft
 * - Automatic session renewal with same-origin and CORS credentials
 */

const API_BASE = '/api/v1';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  tenant_id: string;
  organization_id?: string;
  roles: string[];
}

export class ApiService {
  private static tenantId: string | null = localStorage.getItem('omnirag_tenant_id') || '00000000-0000-0000-0000-000000000001';

  static setTenantId(tenantId: string) {
    this.tenantId = tenantId;
    localStorage.setItem('omnirag_tenant_id', tenantId);
  }

  private static getHeaders(isJson = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    if (this.tenantId) headers['X-Tenant-ID'] = this.tenantId;
    return headers;
  }

  /* ─────────────────────────────────────────────────────────
     AUTHENTICATION & SESSION MANAGEMENT (HttpOnly Cookies)
     ───────────────────────────────────────────────────────── */

  static async register(payload: {
    email: string;
    password: string;
    full_name: string;
    tenant_name?: string;
  }): Promise<any> {
    const resp = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        full_name: payload.full_name,
        tenant_name: payload.tenant_name || `${payload.full_name}'s Workspace`,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || 'Registration failed');
    }
    return resp.json();
  }

  static async login(payload: { email: string; password: string }): Promise<any> {
    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || 'Invalid email or password');
    }
    return resp.json();
  }

  static async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).catch(() => {});
  }

  static async getMe(): Promise<UserProfile> {
    const resp = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error('Session unauthenticated');
    return resp.json();
  }

  static async getGoogleAuthUrl(redirectUri?: string): Promise<{ authorization_url: string; client_id: string | null; prompt: string; configured: boolean }> {
    const url = new URL(`${window.location.origin}${API_BASE}/auth/google/url`);
    if (redirectUri) {
      url.searchParams.set('redirect_uri', redirectUri);
    }
    const resp = await fetch(url.toString(), {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || 'Failed to retrieve Google OAuth2 configuration');
    }
    return resp.json();
  }

  static async googleAuthCallback(payload: {
    code: string;
    redirect_uri?: string;
  }): Promise<any> {
    const resp = await fetch(`${API_BASE}/auth/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || 'Google authentication failed');
    }
    return resp.json();
  }

  /* ─────────────────────────────────────────────────────────
     DOCUMENT INGESTION
     ───────────────────────────────────────────────────────── */

  static async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: this.getHeaders(false),
      credentials: 'include',
      body: formData,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || 'Upload failed');
    }
    return resp.json();
  }

  static async listDocuments(): Promise<any> {
    const resp = await fetch(`${API_BASE}/documents/`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  /* ─────────────────────────────────────────────────────────
     SEARCH & RETRIEVAL
     ───────────────────────────────────────────────────────── */

  static async executeSearch(query: string, strategy: 'hybrid' | 'dense' | 'bm25' = 'hybrid'): Promise<any> {
    const resp = await fetch(`${API_BASE}/search/${strategy}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ query, top_k: 8, enable_reranking: true }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  /* ─────────────────────────────────────────────────────────
     RAG REASONING & CHAT
     ───────────────────────────────────────────────────────── */

  static async executeRAGChat(query: string, conversationId?: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/rag/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ query, conversation_id: conversationId, top_k: 5 }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async queryRAG(params: {
    query: string;
    tenant_id?: string;
    user_role?: string;
    conversation_history?: any[];
  }): Promise<any> {
    const resp = await fetch(`${API_BASE}/rag/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async executeAgenticQuery(query: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/agent/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ query }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async triggerEvaluation(): Promise<any> {
    const resp = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  /* ─────────────────────────────────────────────────────────
     WORKSPACE DATA PERSISTENCE (Real Database Fetching)
     ───────────────────────────────────────────────────────── */

  static async getCollections(): Promise<any[]> {
    const resp = await fetch(`${API_BASE}/workspace/collections`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) return [];
    return resp.json();
  }

  static async createCollection(data: { name: string; description: string; color?: string }): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/collections`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async deleteCollection(id: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/collections/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async getSavedQueries(): Promise<any[]> {
    const resp = await fetch(`${API_BASE}/workspace/saved-queries`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) return [];
    return resp.json();
  }

  static async createSavedQuery(data: { title: string; query_text: string; tag?: string }): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/saved-queries`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async deleteSavedQuery(id: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/saved-queries/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async getUsers(): Promise<any[]> {
    const resp = await fetch(`${API_BASE}/workspace/users`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) return [];
    return resp.json();
  }

  static async inviteUser(data: { email: string; full_name: string; department: string; role: string }): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/users/invite`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async deleteUser(id: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/users/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async getAuditLogs(): Promise<any[]> {
    const resp = await fetch(`${API_BASE}/workspace/audit-logs`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) return [];
    return resp.json();
  }

  static async getTelemetry(): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/telemetry`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) return null;
    return resp.json();
  }

  static async getSystemHealth(): Promise<any> {
    const resp = await fetch(`${API_BASE}/workspace/system-health`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) return null;
    return resp.json();
  }

  /* ─────────────────────────────────────────────────────────
     SUPERADMIN CONTROL PLANE (Zero-Trust Admin-Only)
     ───────────────────────────────────────────────────────── */

  static async getAdminCockpit(): Promise<any> {
    const resp = await fetch(`${API_BASE}/admin/cockpit`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error('Admin privileges required');
    return resp.json();
  }

  static async getAdminTenants(): Promise<any[]> {
    const resp = await fetch(`${API_BASE}/admin/tenants`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error('Admin privileges required');
    return resp.json();
  }

  static async createAdminTenant(data: { name: string; slug: string; plan?: string }): Promise<any> {
    const resp = await fetch(`${API_BASE}/admin/tenants`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async updateAdminUserRole(userId: string, roleOrIsAdmin: string | boolean): Promise<any> {
    const isAdmin = typeof roleOrIsAdmin === 'boolean' ? roleOrIsAdmin : roleOrIsAdmin === 'Admin';
    const resp = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ is_admin: isAdmin, role: typeof roleOrIsAdmin === 'string' ? roleOrIsAdmin : undefined }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async runAdminMaintenance(action?: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/admin/system/maintenance`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action: action || 'vacuum' }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }
}

export const api = ApiService;
