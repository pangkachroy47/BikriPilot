import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Calendar,
  Layers,
  User,
  CreditCard,
  FileText,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { adminAuditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return adminAuditLogs.filter(log => {
      const matchSearch =
        log.action.toLowerCase().includes(q) ||
        log.target_entity.toLowerCase().includes(q) ||
        log.target_entity_id.toLowerCase().includes(q) ||
        (log.admin_email && log.admin_email.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (actionFilter === 'all') return true;
      return log.action.toLowerCase().includes(actionFilter.toLowerCase());
    });
  }, [adminAuditLogs, searchQuery, actionFilter]);

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="অ্যাডমিন অ্যাকশন অডিট লগ" parentName="Admin Control" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">অ্যাডমিন অ্যাকশন ও নিরাপত্তা অডিট লগ</h1>
        <p className="text-sm text-slate-500">
          প্ল্যাটফর্মের সমস্ত অ্যাডমিনিস্ট্রেটিভ সিদ্ধান্ত, পেমেন্ট অনুমোদন ও প্ল্যান পরিবর্তনের অপরিবর্তনীয় হিস্ট্রি
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="অ্যাকশন, এনটিটি আইডি বা অ্যাডমিন দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white cursor-pointer"
        >
          <option value="all">সকল অ্যাকশন</option>
          <option value="payment">পেমেন্ট সম্পর্কিত</option>
          <option value="subscription">সাবস্ক্রিপশন সম্পর্কিত</option>
          <option value="user">ইউজার ও একাউন্ট</option>
          <option value="plan">প্ল্যান ও কুপন</option>
          <option value="settings">সেটিংস পরিবর্তন</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            কোনো অডিট লগ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">সময় ও তারিখ</th>
                  <th className="py-3.5 px-4">অ্যাকশন</th>
                  <th className="py-3.5 px-4">টার্গেট এনটিটি</th>
                  <th className="py-3.5 px-4">এনটিটি আইডি</th>
                  <th className="py-3.5 px-4">অ্যাডমিন</th>
                  <th className="py-3.5 px-4">মেটাডাটা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-slate-500 font-sans text-xs">
                        {new Date(log.created_at).toLocaleString('bn-BD')}
                      </td>

                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 capitalize font-sans">
                        {log.target_entity}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 text-[11px]">
                        {log.target_entity_id}
                      </td>

                      <td className="py-3.5 px-4 font-sans text-slate-600">
                        {log.admin_email || 'System Admin'}
                      </td>

                      <td className="py-3.5 px-4 text-[10px] text-slate-500 max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
