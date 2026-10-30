export interface DocumentItem {
  id: string;
  organization_id: string;
  filename: string;
  mime_type: string;
  sha256_checksum: string;
  file_size_bytes: number;
  status: string;
  storage_uri: string;
  created_at: string;
  updated_at: string;
}

export interface CitationItem {
  citation_id: string;
  chunk_id: string;
  document_id: string;
  page_number: number;
  cited_snippet: string;
  is_valid: boolean;
  confidence_score: number;
}

export interface VerificationReport {
  is_grounded: boolean;
  faithfulness_score: number;
  citation_accuracy_score: number;
  total_citations: number;
  valid_citations_count: number;
  phantom_citations: string[];
  unsupported_claims: string[];
}

export interface RAGMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationItem[];
  verification?: VerificationReport;
  timestamp: string;
}

export interface SearchHit {
  chunk_id: string;
  document_id: string;
  tenant_id: string;
  score: number;
  raw_text: string;
  page_number: number;
  section_heading?: string;
  content_type: string;
  retrieval_source: string;
}

export interface UserProfile {
  id?: string;
  email: string;
  full_name: string;
  tenant_id?: string;
  organization_id?: string;
  roles?: string[];
  is_active?: boolean;
}

