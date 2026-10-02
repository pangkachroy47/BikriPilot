import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { exportCustomersCsv, parseCsvText } from '../../utils/csv';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { getPlanLimits } from '../../utils/subscriptionLimits';
import { UpgradeGateModal } from '../../components/subscription/UpgradeGateModal';
import {
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Download,
  Upload,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { currentShop, customers, addCustomer, importCustomers } = useApp();
  const [searchPhone, setSearchPhone] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const planLimits = getPlanLimits(currentShop.subscription_plan);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState('ঢাকা');
  const [newAddress, setNewAddress] = useState('');
  const [modalError, setModalError] = useState('');

  // Filter by phone search or name
  const filteredCustomers = useMemo(() => {
    const q = searchPhone.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => c.phone.includes(q) || c.name.toLowerCase().includes(q));
  }, [customers, searchPhone]);

  const handleExportCsv = () => {
    if (!planLimits.allowCsvExport) {
      setShowGateModal(true);
      return;
    }
    exportCustomersCsv(filteredCustomers);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        const rows = parseCsvText(text);
        const imported = importCustomers(rows);
        setImportStatus(`সফলভাবে ${imported} জন কাস্টমার ইম্পোর্ট সম্পন্ন হয়েছে!`);
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleSaveCustomer = () => {
    setModalError('');
    if (!newName.trim()) {
      setModalError('কাস্টমারের নাম লিখুন।');
      return;
    }
    if (!newPhone.trim() || newPhone.length < 11) {
      setModalError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }

    addCustomer({
      name: newName,
      phone: newPhone,
      district: newDistrict,
      full_address: newAddress,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
  };

  return (
    <div className="space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="কাস্টমার হিস্ট্রি ও প্রোফাইল"
        parentName="BikriPilot"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">কাস্টমার হিস্ট্রি ও ডাটাবেজ</h1>
          <p className="text-sm text-slate-500">
            মোবাইল নম্বর দিয়ে কাস্টমারের পূর্বের অর্ডার, ডেলিভারি ও রিটার্ন রেকর্ড ট্র্যাক করুন
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>CSV ইমপোর্ট</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV এক্সপোর্ট</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কাস্টমার</span>
          </button>
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)}
            placeholder="মোবাইল নম্বর (017...) বা নাম লিখে সার্চ করুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* Customer Cards & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            কোনো কাস্টমার পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">কাস্টমারের নাম</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4">ঠিকানা</th>
                  <th className="py-3 px-4 text-center">মোট অর্ডার</th>
                  <th className="py-3 px-4 text-center">ডেলিভার্ড</th>
                  <th className="py-3 px-4 text-center">রিটার্ন</th>
                  <th className="py-3 px-4 text-right">মোট বিক্রি</th>
                  <th className="py-3 px-4 text-right">মোট লাভ</th>
                  <th className="py-3 px-4 text-center">বিশ্বাসযোগ্যতা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(cust => {
                  const returnRate = cust.total_orders > 0 ? (cust.returned_orders / cust.total_orders) * 100 : 0;
                  const isHighRisk = returnRate > 40 && cust.total_orders >= 2;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {cust.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {cust.phone}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] text-xs text-slate-600 truncate">
                        {cust.full_address || cust.district}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {cust.total_orders}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                        {cust.delivered_orders}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                        {cust.returned_orders}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatBDT(cust.total_sales)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {formatBDT(cust.estimated_profit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isHighRisk ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>রিটার্ন ঝুঁকি</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>বিশ্বস্ত ক্রেতা</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">নতুন কাস্টমার যুক্ত করুন</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="যেমন: নুসরাত জাহান"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">মোবাইল নম্বর (১১ ডিজিট) *</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">জেলা</label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={e => setNewDistrict(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">পূর্ণ ঠিকানা</label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder="বাসা, রোড ও এলাকা..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Gate Modal for CSV Export */}
      <UpgradeGateModal
        isOpen={showGateModal}
        onClose={() => setShowGateModal(false)}
        reason="csv_export"
      />
    </div>
  );
};
