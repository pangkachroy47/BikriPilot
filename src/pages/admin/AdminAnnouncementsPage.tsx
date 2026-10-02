import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnnouncementRecord } from '../../types';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  Calendar,
  Users,
  X,
} from 'lucide-react';

export const AdminAnnouncementsPage: React.FC = () => {
  const { announcements, createAnnouncement, deleteAnnouncement } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'maintenance'>('info');
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'expired' | 'specific_plan' | 'specific_user'>('all');
  const [targetPlan, setTargetPlan] = useState('');

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    await createAnnouncement({
      title,
      message,
      type,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      target_audience: targetAudience,
      target_plan: targetPlan || undefined,
      is_active: true,
    });

    setIsModalOpen(false);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="ইন-অ্যাপ নোটিশ ও ঘোষণা" parentName="Admin Control" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ইন-অ্যাপ ঘোষণা ও নোটিশ সিস্টেম</h1>
          <p className="text-sm text-slate-500">
            মার্চেন্টদের ড্যাশবোর্ডে গুরুত্বপূর্ণ আপডেট, রক্ষণাবেক্ষণ নোটিশ বা অফার সম্প্রচার করুন
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ঘোষণা তৈরি করুন</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.length === 0 ? (
          <div className="col-span-2 bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            এখনও কোনো সক্রিয় ঘোষণা নেই।
          </div>
        ) : (
          announcements.map(ann => {
            return (
              <div
                key={ann.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ann.type === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : ann.type === 'maintenance'
                          ? 'bg-rose-100 text-rose-800'
                          : ann.type === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ann.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                      {ann.type === 'maintenance' && <Wrench className="w-3 h-3" />}
                      {ann.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
                      {ann.type === 'info' && <Info className="w-3 h-3" />}
                      <span>{ann.type.toUpperCase()}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      টার্গেট: {ann.target_audience}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{ann.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                    {ann.message}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>প্রকাশিত: {new Date(ann.created_at).toLocaleDateString('bn-BD')}</span>
                  <button
                    type="button"
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="ঘোষণা মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Announcement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">নতুন ইন-অ্যাপ নোটিশ প্রকাশ</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">নোটিশের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="যেমন: সার্ভার আপগ্রেড নোটিশ"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">নোটিশের ধরন</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="info">তথ্যমূলক (Info)</option>
                  <option value="warning">সতর্কবার্তা (Warning)</option>
                  <option value="maintenance">রক্ষণাবেক্ষণ (Maintenance)</option>
                  <option value="success">সাফল্য / অফার (Success)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">টার্গেট গ্রাহক গোষ্ঠী</label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="all">সকল মার্চেন্ট (All Users)</option>
                  <option value="active">শুধুমাত্র সক্রিয় সাবস্ক্রাইবার (Active)</option>
                  <option value="expired">মেয়াদোত্তীর্ণ সাবস্ক্রাইবার (Expired)</option>
                  <option value="specific_plan">নির্দিষ্ট প্ল্যান গ্রাহক</option>
                </select>
              </div>

              {targetAudience === 'specific_plan' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">প্ল্যানের নাম লিখুন</label>
                  <input
                    type="text"
                    value={targetPlan}
                    onChange={e => setTargetPlan(e.target.value)}
                    placeholder="free_trial, founder, etc."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিস্তারিত বার্তা *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="মার্চেন্টদের উদ্দেশে আপনার বার্তা লিখুন যা তাদের ড্যাশবোর্ডে প্রদর্শিত হবে..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  ঘোষণা প্রকাশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
