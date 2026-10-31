import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Admin' | 'Analyst' | 'Member' | 'Guest';
  status: 'Active' | 'Invited';
  lastActive: string;
}

export const UsersTeamsView: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([
    {
      id: 'u-1',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@enterprise.ai',
      department: 'Finance & Operations',
      role: 'Admin',
      status: 'Active',
      lastActive: '5 mins ago',
    },
    {
      id: 'u-2',
      name: 'Alex Chen',
      email: 'alex.chen@enterprise.ai',
      department: 'Platform Engineering',
      role: 'Analyst',
      status: 'Active',
      lastActive: '2 hours ago',
    },
    {
      id: 'u-3',
      name: 'Marcus Brody',
      email: 'marcus.brody@enterprise.ai',
      department: 'Security & Compliance',
      role: 'Admin',
      status: 'Active',
      lastActive: 'Yesterday',
    },
    {
      id: 'u-4',
      name: 'Elena Rostova',
      email: 'elena.rostova@enterprise.ai',
      department: 'AI Research',
      role: 'Analyst',
      status: 'Active',
      lastActive: '3 days ago',
    },
    {
      id: 'u-5',
      name: 'Jordan Rivera',
      email: 'jordan.rivera@enterprise.ai',
      department: 'Product Management',
      role: 'Member',
      status: 'Invited',
      lastActive: 'Pending accept',
    },
  ]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Analyst' | 'Member' | 'Guest'>('Member');
  const [inviteDept, setInviteDept] = useState('Engineering');
  const [searchTerm, setSearchTerm] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const created: Member = {
      id: `u-${Date.now()}`,
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      department: inviteDept,
      role: inviteRole,
      status: 'Invited',
      lastActive: 'Just invited',
    };
    setMembers([created, ...members]);
    setIsInviteOpen(false);
    setInviteEmail('');
    setInviteName('');
  };

  const handleRemove = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Users & Workspace Teams</h2>
            <p className="text-xs t-muted">Enterprise team provisioning, single sign-on mapping, and departmental access control</p>
          </div>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Invite Team Member
        </button>
      </div>

      {/* Search & Team Table */}
      <div className="bento-card rounded-3xl p-6 shadow-xl space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 t-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team members by name or email..."
              className="pl-8 pr-3 py-2 text-xs rounded-xl glass-input w-full"
            />
          </div>
          <span className="text-xs t-muted font-mono">{filtered.length} Enterprise Members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b t-muted uppercase font-mono text-[10px]" style={{ borderColor: 'var(--border)' }}>
                <th className="pb-3 font-semibold">User Profile</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Security Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Last Active</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-medium t-primary flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-[11px] t-muted font-mono">{m.email}</div>
                    </div>
                  </td>
                  <td className="py-3.5 t-secondary">{m.department}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        m.role === 'Admin'
                          ? 'badge-purple'
                          : m.role === 'Analyst'
                          ? 'badge-indigo'
                          : 'badge-cyan'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        m.status === 'Active' ? 'badge-emerald' : 'badge-amber'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 t-muted font-mono">{m.lastActive}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 t-muted hover:text-rose-400"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="bento-card rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-base font-bold t-primary">Invite Enterprise Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 rounded-lg t-muted hover:t-primary">
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold t-muted mb-1">Corporate Work Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold t-muted mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold t-muted mb-1">Security Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e: any) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Member">Member</option>
                    <option value="Guest">Guest</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold t-muted mb-1">Department</label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Security">Security</option>
                    <option value="Product">Product</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl bento-chip t-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
