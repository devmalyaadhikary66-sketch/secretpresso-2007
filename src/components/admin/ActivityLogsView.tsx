import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Shield, Clock, Search, Filter, User, Layers, ArrowRight } from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.adminName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchModule = selectedModule === 'ALL' || log.module === selectedModule;
      return matchSearch && matchModule;
    });
  }, [activityLogs, searchQuery, selectedModule]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-serif text-[#fae8be]">Persistent Security Audit Trail & Activity Logs</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Immutable event log of every operational modification, price adjustment, and state transition.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c12]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, administrator, or modified entity..."
            className="w-full pl-9 pr-4 py-2 bg-[#1b100a] border border-[#382319] focus:border-[#cfa851] rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'Orders', 'Products', 'Inventory', 'Website', 'Store Control', 'Coupons', 'Staff'].map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase whitespace-nowrap transition ${
                selectedModule === mod
                  ? 'bg-[#cfa851] text-zinc-950 font-bold shadow'
                  : 'bg-[#1b100a] text-zinc-400 hover:text-zinc-200 border border-[#2c1b12]'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#281810] text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-[#180f0b]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action Executed</th>
                <th className="py-3 px-4">Details & Mutation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20140d]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs">
                    No activity records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a100a] transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-zinc-200">{log.adminName}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{log.adminEmail}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#20130c] border border-[#382216] text-[#e6ca85]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-100">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      <p className="text-xs">{log.details}</p>
                      {log.oldValue && log.newValue && (
                        <div className="mt-1 font-mono text-[10px] text-zinc-500 flex items-center gap-1.5 truncate max-w-md">
                          <span className="text-red-400 line-through truncate">{log.oldValue}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                          <span className="text-emerald-400 truncate">{log.newValue}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
