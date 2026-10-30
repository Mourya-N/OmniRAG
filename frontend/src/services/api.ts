const API_BASE = '/api/v1';

export class ApiService {
  private static token: string | null = localStorage.getItem('omnirag_token');
  private static tenantId: string | null = localStorage.getItem('omnirag_tenant_id');

  static setAuth(token: string, tenantId: string) {
    this.token = token;
    this.tenantId = tenantId;
    localStorage.setItem('omnirag_token', token);
    localStorage.setItem('omnirag_tenant_id', tenantId);
  }

  private static getHeaders(isJson = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.tenantId) headers['X-Tenant-ID'] = this.tenantId;
    return headers;
  }

  static async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData,
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async listDocuments(): Promise<any> {
    const resp = await fetch(`${API_BASE}/documents/`, {
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async executeSearch(query: string, strategy: 'hybrid' | 'dense' | 'bm25' = 'hybrid'): Promise<any> {
    const resp = await fetch(`${API_BASE}/search/${strategy}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, top_k: 8, enable_reranking: true }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async executeRAGChat(query: string, conversationId?: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/rag/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, conversation_id: conversationId, top_k: 5 }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async executeAgenticQuery(query: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/agent/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async triggerEvaluation(): Promise<any> {
    const resp = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }
}

