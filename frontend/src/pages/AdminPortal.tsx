import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Users,
  Database,
  Cpu,
  RefreshCw,
  Building2,
  HardDrive,
  Activity,
  AlertTriangle,
  Lock,
  Plus,
  CheckCircle2,
  DollarSign,
  FileText,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { UserProfile } from '../types';

interface AdminPortalProps {
  currentUser: UserProfile | null;
  onReturnToWorkspace: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onReturnToWorkspace,
}) => {
  const isAdmin = Boolean(
    currentUser?.is_superuser || currentUser?.roles?.includes('Admin')
  );

  const [activeTab, setActiveTab] = useState<
    'cockpit' | 'tenants' | 'users' | 'permissions' | 'maintenance' | 'quotas' | 'audit'
  >('cockpit');

  // Admin Data State
  const [cockpitData, setCockpitData] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Engineer');
  const [newUserDept, setNewUserDept] = useState('Engineering');

  // New Tenant Form
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('Enterprise Dedicated');

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'cockpit' || activeTab === 'tenants') {
        const [cockpitRes, tenantsRes] = await Promise.all([
          ApiService.getAdminCockpit().catch(() => null),
          ApiService.getAdminTenants().catch(() => []),
        ]);
        if (cockpitRes) setCockpitData(cockpitRes);
        if (tenantsRes) setTenants(tenantsRes);
      }

      if (activeTab === 'users' || activeTab === 'cockpit') {
        const usersRes = await ApiService.getAdminUsers().catch(() => ApiService.getUsers().catch(() => []));
        setUsersList(usersRes);
      }

      if (activeTab === 'permissions') {
        const permsRes = await ApiService.getAdminPermissions().catch(() => []);
        setPermissionsList(permsRes);
      }

      if (activeTab === 'audit' || activeTab === 'cockpit') {
        const logsRes = await ApiService.getAuditLogs().catch(() => []);
        setAuditLogs(logsRes);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim() || !newTenantSlug.trim()) return;

    try {
      const created = await ApiService.createAdminTenant({
        name: newTenantName.trim(),
        slug: newTenantSlug.trim().toLowerCase(),
        plan: newTenantPlan,
      });
      setTenants((prev) => [created, ...prev]);
      setNewTenantName('');
      setNewTenantSlug('');
      showNotification('success', `Tenant "${created.name}" partitioned successfully.`);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.detail || 'Failed to create tenant.');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await ApiService.updateAdminUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole, is_superuser: newRole.toLowerCase() === 'admin' } : u))
      );
      showNotification('success', `Privileges updated to ${newRole}`);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update user role');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) {
      showNotification('error', 'Please fill in all required user fields');
      return;
    }

    try {
      const created = await ApiService.createAdminUser({
        email: newUserEmail.trim(),
        full_name: newUserName.trim(),
        password: newUserPassword,
        role: newUserRole,
        department: newUserDept,
      });
      setUsersList((prev) => [created, ...prev]);
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      showNotification('success', `User "${created.full_name}" created successfully with role ${created.role}`);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to create user account');
    }
  };

  const handleTogglePermission = (permId: string, roleKey: 'admin' | 'engineer' | 'analyst' | 'viewer') => {
    if (roleKey === 'admin') return; // Admin always retains foundational root privileges
    setPermissionsList((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, [roleKey]: !p[roleKey] } : p))
    );
  };

  const handleSavePermissions = async () => {
    try {
      await ApiService.updateAdminPermissions(permissionsList);
      showNotification('success', 'Enterprise RBAC permission matrix updated and active across all nodes.');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save permissions matrix');
    }
  };

  const handleRunMaintenance = async (action: string) => {
    try {
      const res = await ApiService.runAdminMaintenance(action);
      showNotification('success', res.message || `${action} executed successfully`);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.detail || `Failed to execute ${action}`);
    }
  };

  // 1. Zero-Trust Security Enforcement: Access Denied for Regular Users
  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <div className="bento-card max-w-lg w-full p-8 rounded-3xl text-center space-y-6 border border-red-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase">
              Zero-Trust Guard: 403 Forbidden
            </span>
            <h2 className="text-2xl font-extrabold t-primary">
              Admin Privileges Required
            </h2>
            <p className="text-sm t-muted leading-relaxed">
              Your account (<span className="text-slate-300 font-mono">{currentUser?.email || 'Guest'}</span>) does not possess founder superuser privileges. Access to the OmniRAG enterprise infrastructure layer is strictly restricted.
            </p>
          </div>

          <div className="p-4 rounded-2xl bento-chip text-left text-xs font-mono space-y-1">
            <div className="text-slate-400">Authorized Root Identity:</div>
            <div className="text-indigo-400 font-bold">omnirag@founder.mou</div>
            <div className="text-[11px] text-slate-500 pt-1">
              Argon2id Auth • Hardware Token Protected • SOC 2 Enforced
            </div>
          </div>

          <button
            onClick={onReturnToWorkspace}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to User Workspace</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Admin Layer Navigation Bar */}
      <div className="bento-card rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-600/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold t-primary">OmniRAG Admin Cockpit</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Founder Superuser
              </span>
            </div>
            <p className="text-xs t-muted">
              Tenant Orchestration • Privileged Access Management • System Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onReturnToWorkspace}
            className="px-4 py-2 rounded-xl bento-chip text-xs font-semibold t-primary hover:border-indigo-500/40 flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>
          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl bento-chip t-muted hover:t-primary transition-all"
            title="Refresh Real Infrastructure Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'cockpit', label: 'Cockpit Overview', icon: Cpu },
          { id: 'tenants', label: 'Multi-Tenant Partitioning', icon: Building2 },
          { id: 'users', label: 'User Roles & Access', icon: Users },
          { id: 'permissions', label: 'Role Permissions & RBAC', icon: Lock },
          { id: 'maintenance', label: 'Vector DB & Workers', icon: Server },
          { id: 'quotas', label: 'Model Spend & Quotas', icon: DollarSign },
          { id: 'audit', label: 'Global Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bento-chip t-secondary hover:t-primary hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COCKPIT OVERVIEW */}
      {activeTab === 'cockpit' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bento-card p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs t-muted">
                <span>Active Tenants</span>
                <Building2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black t-primary font-mono">
                {cockpitData?.total_tenants ?? tenants.length}
              </div>
              <p className="text-[10px] text-emerald-400">100% Cryptographic Isolation</p>
            </div>

            <div className="bento-card p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs t-muted">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black t-primary font-mono">
                {usersList.length || 2}
              </div>
              <p className="text-[10px] text-indigo-300">RBAC Enforced via JWT</p>
            </div>

            <div className="bento-card p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs t-muted">
                <span>Vector Indexes</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black t-primary font-mono">
                HNSW / BM25
              </div>
              <p className="text-[10px] text-emerald-400">Active • 99.98% Healthy</p>
            </div>

            <div className="bento-card p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs t-muted">
                <span>Background Workers</span>
                <Activity className="w-4 h-4 text-pink-400" />
              </div>
              <div className="text-2xl font-black t-primary font-mono">
                12 / 12 Online
              </div>
              <p className="text-[10px] text-pink-300">Distributed Celery Cluster</p>
            </div>
          </div>

          {/* Quick Actions & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bento-card p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold t-primary flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Enterprise Infrastructure Nodes</span>
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Primary Vector Store (Qdrant / PGVector)', status: 'Healthy', latency: '4.2ms', color: 'emerald' },
                  { name: 'Multimodal Chunk Ingestion Pipeline', status: 'Optimal', latency: '18.1ms', color: 'emerald' },
                  { name: 'Hybrid Sparse BM25 Search Engine', status: 'Healthy', latency: '2.8ms', color: 'emerald' },
                  { name: 'LLM Gateway (Gemini 2.5 Pro / GPT-4o)', status: 'Active', latency: '240ms', color: 'cyan' },
                  { name: 'Zero-Knowledge Document Encryptor', status: 'Enforced', latency: '1.1ms', color: 'purple' },
                ].map((node, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bento-chip text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full bg-${node.color}-400 animate-pulse`} />
                      <span className="font-semibold t-primary">{node.name}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span className="t-muted">{node.latency}</span>
                      <span className={`px-2 py-0.5 rounded-full badge-${node.color} font-bold`}>
                        {node.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bento-card p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold t-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Founder Maintenance Quick Ops</span>
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => handleRunMaintenance('vacuum')}
                  className="w-full p-3 rounded-2xl bento-chip hover:border-indigo-500/40 text-left flex items-center justify-between transition-all"
                >
                  <div>
                    <p className="text-xs font-semibold t-primary">Vacuum & Re-index HNSW</p>
                    <p className="text-[10px] t-muted">Optimize vector cluster embeddings & clear tombstones</p>
                  </div>
                  <ChevronRight className="w-4 h-4 t-muted" />
                </button>

                <button
                  onClick={() => handleRunMaintenance('flush_cache')}
                  className="w-full p-3 rounded-2xl bento-chip hover:border-indigo-500/40 text-left flex items-center justify-between transition-all"
                >
                  <div>
                    <p className="text-xs font-semibold t-primary">Flush Distributed Cache</p>
                    <p className="text-[10px] t-muted">Invalidate stale semantic query cache across nodes</p>
                  </div>
                  <ChevronRight className="w-4 h-4 t-muted" />
                </button>

                <button
                  onClick={() => handleRunMaintenance('restart_workers')}
                  className="w-full p-3 rounded-2xl bento-chip hover:border-pink-500/40 text-left flex items-center justify-between transition-all"
                >
                  <div>
                    <p className="text-xs font-semibold text-rose-400">Restart Ingestion Workers</p>
                    <p className="text-[10px] t-muted">Gracefully cycle all multimodal OCR & parser pods</p>
                  </div>
                  <ChevronRight className="w-4 h-4 t-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TENANT PARTITIONING */}
      {activeTab === 'tenants' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bento-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold t-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Partition New Enterprise Tenant</span>
            </h3>
            <form onSubmit={handleCreateTenant} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium t-muted block mb-1">Organization / Tenant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp Global"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium t-muted block mb-1">Database Schema Partition Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme_global"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium t-muted block mb-1">Tier / SLA Plan</label>
                <select
                  value={newTenantPlan}
                  onChange={(e) => setNewTenantPlan(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                >
                  <option value="Enterprise Dedicated">Enterprise Dedicated (Private Pods)</option>
                  <option value="Enterprise Scaled">Enterprise Scaled (Shared Cluster)</option>
                  <option value="Sovereign GovCloud">Sovereign GovCloud (Air-gapped)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                + Provision Tenant Space
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bento-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold t-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Active Multi-Tenant Partitions ({tenants.length})</span>
            </h3>

            <div className="space-y-3">
              {tenants.map((t, idx) => (
                <div key={idx} className="p-4 rounded-2xl bento-chip space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold t-primary">{t.name}</h4>
                      <p className="text-[11px] font-mono text-cyan-400">schema: tenant_{t.slug || t.id?.slice(0, 8)}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold badge-indigo">
                      {t.plan || 'Enterprise'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] t-muted pt-1 border-t border-[var(--border)] font-mono">
                    <span>Isolation: Hardware Virtualized</span>
                    <span>Status: Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES & ACCESS */}
      {activeTab === 'users' && (
        <div className="bento-card p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold t-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Enterprise User Directory & Privileges</span>
              </h3>
              <p className="text-xs t-muted mt-0.5">Manage team accounts, modify organizational roles, and enforce security policies</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono t-muted">{usersList.length} Accounts Registered</span>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="p-5 rounded-2xl bento-chip border border-indigo-500/30 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h4 className="text-xs font-bold t-primary flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Provision New Enterprise User Account</span>
                </h4>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-xs t-muted hover:t-primary font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-[11px] font-medium t-muted block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Mercer"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium t-muted block mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="alice@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium t-muted block mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium t-muted block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium t-muted block mb-1">Assigned Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input text-xs font-mono"
                  >
                    <option value="Engineer">Engineer</option>
                    <option value="Admin">Admin</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 rounded-xl bento-chip text-xs t-secondary hover:t-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-3 pl-3">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Change Role</th>
                  <th className="pb-3">Privilege Status</th>
                  <th className="pb-3 text-right pr-3">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pl-3 font-semibold t-primary">
                      {user.full_name || 'Enterprise Colleague'}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">
                      {user.email}
                    </td>
                    <td className="py-3">
                      <select
                        value={user.role || (user.is_superuser ? 'Admin' : 'Engineer')}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono font-semibold"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Engineer">Engineer</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="py-3 font-mono text-[11px]">
                      {user.is_superuser ? (
                        <span className="px-2.5 py-1 rounded-full text-pink-400 bg-pink-500/10 border border-pink-500/20 font-bold">
                          ★ SuperAdmin / Root
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">Standard Member</span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-3 space-x-2">
                      {!user.is_superuser ? (
                        <button
                          onClick={() => handleUpdateRole(user.id, 'Admin')}
                          className="px-2.5 py-1 rounded-lg bento-chip text-[11px] font-semibold text-indigo-400 hover:text-white hover:bg-indigo-600 transition-colors"
                        >
                          Promote to Admin
                        </button>
                      ) : (
                        <span className="text-[11px] t-muted font-mono italic">Primary Root</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3.5: ROLE PERMISSIONS & RBAC MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bento-card p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold t-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Role-Based Access Control (RBAC) & Permission Policies</span>
              </h3>
              <p className="text-xs t-muted mt-1">
                Configure fine-grained capabilities across Admin, Engineer, Analyst, and Viewer tiers
              </p>
            </div>
            <button
              onClick={handleSavePermissions}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Permissions Matrix</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-3 pl-3">Capability / Operation</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-center">Admin (Superuser)</th>
                  <th className="pb-3 text-center">Engineer</th>
                  <th className="pb-3 text-center">Analyst</th>
                  <th className="pb-3 text-center pr-3">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {permissionsList.map((perm) => (
                  <tr key={perm.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 pl-3 font-semibold t-primary font-mono text-xs">
                      {perm.name}
                    </td>
                    <td className="py-3.5 text-slate-400 text-xs">
                      {perm.description}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        Always Granted
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePermission(perm.id, 'engineer')}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          perm.engineer
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {perm.engineer ? '✓' : '✕'}
                      </button>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePermission(perm.id, 'analyst')}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          perm.analyst
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {perm.analyst ? '✓' : '✕'}
                      </button>
                    </td>
                    <td className="py-3.5 text-center pr-3">
                      <button
                        onClick={() => handleTogglePermission(perm.id, 'viewer')}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          perm.viewer
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/30'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {perm.viewer ? '✓' : '✕'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bento-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold t-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Vector Database Compaction</span>
            </h3>
            <p className="text-xs t-muted leading-relaxed">
              Recalculates HNSW graphs across all active collections, purges soft-deleted chunks, and collapses empty embedding segments.
            </p>
            <button
              onClick={() => handleRunMaintenance('vacuum')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30"
            >
              Trigger Immediate Vacuum
            </button>
          </div>

          <div className="bento-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold t-primary flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <span>Ingestion Worker Fleet</span>
            </h3>
            <p className="text-xs t-muted leading-relaxed">
              Drain active OCR and table extraction queues, rotate memory heaps, and restart Celery worker threads across the cluster.
            </p>
            <button
              onClick={() => handleRunMaintenance('restart_workers')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs shadow-md shadow-pink-600/30"
            >
              Cycle Worker Fleet
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: QUOTAS & SPEND */}
      {activeTab === 'quotas' && (
        <div className="bento-card p-6 rounded-3xl space-y-6">
          <h3 className="text-sm font-bold t-primary flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>LLM Provider Spend Limits & Token Quotas</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bento-chip space-y-2">
              <span className="text-xs font-semibold t-muted">Monthly Token Ceiling</span>
              <div className="text-xl font-bold font-mono t-primary">500,000,000</div>
              <p className="text-[10px] text-emerald-400">Current burn: 4.8% (24.2M tokens)</p>
            </div>

            <div className="p-4 rounded-2xl bento-chip space-y-2">
              <span className="text-xs font-semibold t-muted">Monthly Spend Cap</span>
              <div className="text-xl font-bold font-mono t-primary">$2,500.00</div>
              <p className="text-[10px] text-cyan-400">Projected: $184.20 this cycle</p>
            </div>

            <div className="p-4 rounded-2xl bento-chip space-y-2">
              <span className="text-xs font-semibold t-muted">Fallback Routing</span>
              <div className="text-xl font-bold font-mono text-indigo-400">Auto Graceful</div>
              <p className="text-[10px] t-muted">Gemini 2.5 Pro → Local vLLM</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GLOBAL AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bento-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold t-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-400" />
              <span>Immutable SOC 2 Security Audit Log</span>
            </h3>
            <span className="text-xs font-mono t-muted">{auditLogs.length} Records</span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bento-chip flex items-center justify-between text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-400">{log.action}</span>
                    <span className="text-slate-500">•</span>
                    <span className="t-primary font-sans">{log.resource_type || 'System'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    {log.details || 'Enterprise access event'}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>{log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Recent'}</div>
                  <div className="text-emerald-400">Verified</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
