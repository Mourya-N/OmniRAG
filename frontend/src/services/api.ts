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

  static async getGoogleAuthUrl(): Promise<{ authorization_url: string; client_id: string | null; prompt: string; is_mock: boolean }> {
    const resp = await fetch(`${API_BASE}/auth/google/url`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!resp.ok) throw new Error('Failed to retrieve Google OAuth2 configuration');
    return resp.json();
  }

  static async googleAuthCallback(payload: {
    code?: string;
    email?: string;
    full_name?: string;
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
}

export const api = ApiService;
