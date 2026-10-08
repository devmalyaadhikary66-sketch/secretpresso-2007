import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, Mail, Shield, Coffee, KeyRound, ArrowRight, UserCheck } from 'lucide-react';
import { AdminRole } from '../../types';

interface AdminLoginProps {
  onSuccess?: () => void;
  onSwitchToCustomer?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onSwitchToCustomer }) => {
  const { loginAdmin, staff } = useStore();
  const [email, setEmail] = useState('devmalyaadhikary748@gmail.com');
  const [password, setPassword] = useState('secretpresso2026');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('SUPER_ADMIN');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const ok = loginAdmin(email, selectedRole);
      if (ok) {
        onSuccess?.();
      } else {
        setError('Invalid credentials or account is deactivated.');
      }
    }, 450);
  };

  const handleQuickRoleSelect = (memberEmail: string, role: AdminRole) => {
    setEmail(memberEmail);
    setSelectedRole(role);
    setPassword('secretpresso2026');
  };

  return (
    <div className="min-h-screen bg-[#080503] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(207,168,81,0.12),rgba(255,255,255,0))] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2a1a12] to-[#120b08] border border-[#cfa851]/40 shadow-2xl shadow-[#cfa851]/10 mb-4">
          <Coffee className="w-8 h-8 text-[#cfa851]" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#a3792c]">
          SECRETPRESSO
        </h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-[#cfa851] font-mono">
          Executive Admin & Control Center
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Authorized personnel and operations control portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-[#120b08]/90 border border-[#301f16] shadow-2xl shadow-black/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@secretpresso.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#180f0b] border border-[#382319] focus:border-[#cfa851] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#cfa851] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Access Key / Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-[#cfa851] hover:underline"
                >
                  Forgot Key?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#180f0b] border border-[#382319] focus:border-[#cfa851] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#cfa851] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Target Role Environment
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
                className="w-full px-3.5 py-2.5 bg-[#180f0b] border border-[#382319] focus:border-[#cfa851] rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#cfa851] transition"
              >
                <option value="SUPER_ADMIN">Super Admin (All Modules & Permissions)</option>
                <option value="MANAGER">Manager (Orders, Products, Customers, Analytics)</option>
                <option value="KITCHEN_STAFF">Kitchen Staff (KDS & Live Orders Only)</option>
                <option value="INVENTORY_MANAGER">Inventory Manager (Stock, Raw Materials, Suppliers)</option>
                <option value="ORDER_MANAGER">Order Manager (Live Orders & Delivery Dispatch)</option>
                <option value="CONTENT_EDITOR">Content Editor (Website CMS & Hero Manager)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm tracking-wide text-zinc-950 bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] hover:brightness-110 shadow-lg shadow-[#cfa851]/20 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate & Enter Admin Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Tester Profiles */}
          <div className="mt-8 pt-6 border-t border-[#261710]">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-[#cfa851]" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Quick Role Tester Profiles (One-Click)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {staff.slice(0, 6).map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleQuickRoleSelect(member.email, member.role)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition ${
                    email === member.email
                      ? 'bg-[#2a1a12] border-[#cfa851] text-zinc-100 shadow-md shadow-[#cfa851]/10'
                      : 'bg-[#160e0a]/80 border-[#301f16] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <p className="font-semibold truncate text-[#f2e6d6]">{member.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-[#cfa851] font-mono uppercase mt-0.5">
                    {member.role.replace('_', ' ')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {onSwitchToCustomer && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onSwitchToCustomer}
                className="text-xs text-zinc-400 hover:text-[#cfa851] transition"
              >
                ← Return to SECRETpresso Customer Storefront
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#140e0a] border border-[#382319] w-full max-w-md rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-lg font-bold font-serif text-[#fae8be]">Reset Admin Credentials</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Enter your registered staff email address to receive password reset protocol.
            </p>

            {resetSent ? (
              <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs">
                A security link has been dispatched to {email}. Follow the instructions to recover access.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@secretpresso.com"
                  className="w-full px-3.5 py-2.5 bg-[#180f0b] border border-[#382319] focus:border-[#cfa851] rounded-xl text-sm text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => setResetSent(true)}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wide bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] transition"
                >
                  Dispatch Security Reset Link
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
                className="px-4 py-2 text-xs rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
