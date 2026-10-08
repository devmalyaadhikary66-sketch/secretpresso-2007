import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminUser, AdminRole } from '../../types';
import {
  Shield,
  UserPlus,
  Check,
  X,
  Lock,
  Mail,
  Phone,
  Power,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export const StaffRolesView: React.FC = () => {
  const { staff, addStaffMember, updateStaffMember, toggleStaffActive, currentAdmin } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Omit<AdminUser, 'id'>>({
    name: '',
    email: '',
    phone: '',
    role: 'MANAGER',
    isActive: true,
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStaffMember(newStaff);
    setIsAddModalOpen(false);
    setNewStaff({
      name: '',
      email: '',
      phone: '',
      role: 'MANAGER',
      isActive: true,
    });
  };

  const roleDefinitions: Record<AdminRole, { title: string; modules: string[] }> = {
    SUPER_ADMIN: {
      title: 'Super Admin',
      modules: ['All Modules', 'Staff Admin', 'Settings', 'Financials', 'Store Override'],
    },
    MANAGER: {
      title: 'Manager',
      modules: ['Orders', 'Products', 'Customers CRM', 'Analytics', 'Coupons'],
    },
    KITCHEN_STAFF: {
      title: 'Kitchen Staff (KDS)',
      modules: ['Kitchen Display', 'Live Orders Ticket Queue'],
    },
    INVENTORY_MANAGER: {
      title: 'Inventory Manager',
      modules: ['Raw Materials', 'Suppliers', 'Stock Inflow POs'],
    },
    ORDER_MANAGER: {
      title: 'Order Manager',
      modules: ['Orders', 'Live Orders', 'Delivery Fleet'],
    },
    CONTENT_EDITOR: {
      title: 'Content Editor',
      modules: ['Website CMS', 'Hero Slides', 'Review Moderation'],
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Role-Based Access Control (RBAC) & Staff Roster</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Admin privilege delegation, operational module restriction, and account management.
          </p>
        </div>

        {currentAdmin?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map((member) => (
          <div
            key={member.id}
            className={`p-5 rounded-2xl bg-[#140c08] border transition shadow-xl flex flex-col justify-between ${
              member.isActive ? 'border-[#2e1c12] hover:border-[#cfa851]/40' : 'border-zinc-800 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#251710] border border-[#3e271c] flex items-center justify-center font-bold text-sm text-[#cfa851]">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">{member.name}</h3>
                    <span className="text-[10px] font-mono text-[#cfa851] uppercase">
                      {roleDefinitions[member.role]?.title || member.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleStaffActive(member.id)}
                  title={member.isActive ? 'Deactivate Account' : 'Activate Account'}
                  className={`p-1.5 rounded-lg transition ${
                    member.isActive ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 text-xs text-zinc-400 py-3 border-y border-[#261710]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.lastLogin && (
                  <p className="text-[10px] text-zinc-500 font-mono pt-1">
                    Last active: {new Date(member.lastLogin).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Module permissions pills */}
              <div className="mt-3">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1.5">
                  Authorized Modules
                </span>
                <div className="flex flex-wrap gap-1">
                  {roleDefinitions[member.role]?.modules.map((mod, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#1f130b] border border-[#331f13] text-[10px] text-zinc-300 font-mono"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {currentAdmin?.role === 'SUPER_ADMIN' && member.email !== currentAdmin.email && (
              <div className="mt-4 pt-3 border-t border-[#261710] flex justify-between items-center text-xs">
                <span className="text-zinc-500 text-[11px]">Reassign Role:</span>
                <select
                  value={member.role}
                  onChange={(e) => updateStaffMember(member.id, { role: e.target.value as AdminRole })}
                  className="px-2 py-1 bg-[#1c110a] border border-[#352115] rounded-lg text-xs font-mono text-[#cfa851]"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="KITCHEN_STAFF">Kitchen Staff</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="ORDER_MANAGER">Order Manager</option>
                  <option value="CONTENT_EDITOR">Content Editor</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Permissions Matrix Reference Table */}
      <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl">
        <h3 className="text-sm font-bold font-serif text-[#fae8be] mb-3">
          Security Roles & Privileges Matrix
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#281810] text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-[#180f0b]">
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Live Orders & KDS</th>
                <th className="py-2.5 px-3">Products CRUD</th>
                <th className="py-2.5 px-3">Inventory & POs</th>
                <th className="py-2.5 px-3">Website CMS</th>
                <th className="py-2.5 px-3">Financials & AOV</th>
                <th className="py-2.5 px-3">Store Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20140d]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#cfa851]">Super Admin</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-200">Manager</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-zinc-500">Read-Only</td>
                <td className="py-2.5 px-3 text-zinc-500">Read-Only</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-red-400">Restricted</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-200">Kitchen Staff</td>
                <td className="py-2.5 px-3 text-emerald-400">KDS Active</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-red-400">Financials Hidden</td>
                <td className="py-2.5 px-3 text-red-400">Restricted</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-200">Inventory Manager</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-zinc-500">Stock edit only</td>
                <td className="py-2.5 px-3 text-emerald-400">Full Access</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-red-400">Restricted</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-zinc-200">Content Editor</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-zinc-500">Copy editing</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-emerald-400">Full CMS</td>
                <td className="py-2.5 px-3 text-red-400">Hidden</td>
                <td className="py-2.5 px-3 text-red-400">Restricted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Provision Staff Account
            </h3>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Matteo Ferrari"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="matteo@secretpresso.com"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={newStaff.phone || ''}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="+91 98300 99887"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Assigned Operational Role *
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as AdminRole })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                >
                  <option value="MANAGER">Manager</option>
                  <option value="KITCHEN_STAFF">Kitchen Staff</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="ORDER_MANAGER">Order Manager</option>
                  <option value="CONTENT_EDITOR">Content Editor</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
