import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { exportProductsCsv, parseCsvText } from '../../utils/csv';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { checkProductLimit, getPlanLimits } from '../../utils/subscriptionLimits';
import { UpgradeGateModal, GateReason } from '../../components/subscription/UpgradeGateModal';
import {
  Package,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Edit2,
  DollarSign,
  Layers,
  X,
  Check,
  Lock,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { currentShop, products, addProduct, updateProduct, deleteProduct, importProducts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upgrade Gate Modal
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateReason, setGateReason] = useState<GateReason>('product_limit');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const productLimit = checkProductLimit(currentShop, products.length);
  const planLimits = getPlanLimits(currentShop.subscription_plan);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [variant, setVariant] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.variant.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const handleOpenAdd = () => {
    if (productLimit.isLimitReached) {
      setGateReason('product_limit');
      setShowGateModal(true);
      return;
    }
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setVariant('Standard');
    setSellingPrice(1200);
    setCostPrice(600);
    setStock(25);
    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setVariant(p.variant);
    setSellingPrice(p.selling_price);
    setCostPrice(p.cost_price);
    setStock(p.stock);
    setImageUrl(p.image_url || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('পণ্যের নাম আবশ্যক।');
      return;
    }
    if (sellingPrice <= 0) {
      setErrorMsg('সঠিক বিক্রয় মূল্য লিখুন।');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        sku,
        variant,
        selling_price: sellingPrice,
        cost_price: costPrice,
        stock,
        image_url: imageUrl,
      });
    } else {
      addProduct({
        name,
        sku,
        variant,
        selling_price: sellingPrice,
        cost_price: costPrice,
        stock,
        image_url: imageUrl,
      });
    }
    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    if (!planLimits.allowCsvExport) {
      setGateReason('csv_export');
      setShowGateModal(true);
      return;
    }
    exportProductsCsv(filteredProducts);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        const rows = parseCsvText(text);
        const count = importProducts(rows);
        setImportStatus(`সফলভাবে ${count}টি প্রোডাক্ট ইম্পোর্ট সম্পন্ন হয়েছে!`);
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="প্রোডাক্ট ক্যাটালগ ও স্টক"
        parentName="BikriPilot"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">প্রোডাক্ট ও ইনভেন্টরি</h1>
          <p className="text-sm text-slate-500">
            মোট {products.length}টি প্রোডাক্টের স্টক, ক্রয় খরচ ও মুনাফা মার্জিন
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
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন প্রোডাক্ট</span>
          </button>
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Subscription Product Quota Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900">
              ইনভেন্টরি কোটা: {products.length} / {planLimits.maxProducts} টি পণ্য ব্যবহৃত
            </div>
            <div className="text-[11px] text-slate-500">
              বর্তমান প্ল্যান: <strong>{planLimits.nameBn}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-300 ${
                productLimit.isLimitReached ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, Math.round((products.length / planLimits.maxProducts) * 100))}%`,
              }}
            />
          </div>
          {productLimit.isLimitReached && (
            <button
              onClick={() => {
                setGateReason('product_limit');
                setShowGateModal(true);
              }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg"
            >
              কোটা শেষ! আপগ্রেড করুন
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="প্রোডাক্টের নাম, SKU বা ভ্যারিয়েন্ট দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(p => {
          const itemProfit = p.selling_price - p.cost_price;
          const margin = p.selling_price > 0 ? Math.round((itemProfit / p.selling_price) * 100) : 0;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <img
                  src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{p.name}</h3>
                  <div className="text-xs text-slate-500 font-medium truncate">{p.variant}</div>
                  <div className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">বিক্রয় মূল্য:</span>
                  <span className="font-bold text-slate-900">{formatBDT(p.selling_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ক্রয় খরচ:</span>
                  <span className="font-semibold text-slate-600">{formatBDT(p.cost_price)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-emerald-700">সম্ভাব্য লাভ:</span>
                  <span className="text-emerald-700">
                    {formatBDT(itemProfit)} ({margin}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  মজুদ: {p.stock} টি
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                    title="এডিট করুন"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('আপনি কি এই প্রোডাক্টটি মুছতে চান?')) {
                        deleteProduct(p.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                    title="মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">পণ্যের নাম *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="যেমন: কাশ্মীরি পাঞ্জাবি"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">SKU কোড</label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ভ্যারিয়েন্ট / সাইজ</label>
                <input
                  type="text"
                  value={variant}
                  onChange={e => setVariant(e.target.value)}
                  placeholder="যেমন: XL / কালো"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">বিক্রয় মূল্য (টাকা) *</label>
                <input
                  type="number"
                  min={0}
                  value={sellingPrice}
                  onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ক্রয় খরচ (টাকা)</label>
                <input
                  type="number"
                  min={0}
                  value={costPrice}
                  onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">মজুদ স্টক (পিস)</label>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={e => setStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ছবির URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Gate Modal */}
      <UpgradeGateModal
        isOpen={showGateModal}
        onClose={() => setShowGateModal(false)}
        reason={gateReason}
      />
    </div>
  );
};
