'use client';

import { useState, useEffect } from "react";
import {
  Package2,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  capacity: number;
  restock_qty: number;
  status: string;
  created_at: string;
}

const categories = ["手机", "电脑", "平板", "穿戴", "配件", "其他"];
const PAGE_SIZE = 5;

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof InventoryItem>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [newItem, setNewItem] = useState({ name: "", category: "手机", stock: 0, capacity: 100 });
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast()

  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => { setInventory(data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch inventory:', err); setLoading(false); });
  }, []);

  const filteredInventory = inventory
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const totalPages = Math.ceil(filteredInventory.length / PAGE_SIZE);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          category: newItem.category,
          stock: newItem.stock,
          capacity: newItem.capacity,
        }),
      });
      const item = await res.json();
      setInventory([...inventory, item]);
      setNewItem({ name: "", category: "手机", stock: 0, capacity: 100 });
      setShowModal(false);
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      setIsDeleting(true);
      try {
        await fetch(`/api/inventory/${deleteItem.id}`, { method: 'DELETE' });
        await new Promise(resolve => setTimeout(resolve, 300));
        setInventory(inventory.filter(item => item.id !== deleteItem.id));
        setDeleteItem(null);
        showToast("success", "删除成功");
      } catch (err) {
        console.error('Failed to delete item:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: typeof CheckCircle2; class: string }> = {
      normal: { icon: CheckCircle2, class: "bg-emerald-50 text-emerald-600" },
      low: { icon: AlertTriangle, class: "bg-orange-50 text-orange-600" },
      critical: { icon: XCircle, class: "bg-red-50 text-red-600" },
    };
    const { icon: Icon, class: cls } = config[status] || config.normal;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        <Icon className="w-3 h-3" />
        {status === "normal" ? "正常" : status === "low" ? "库存低" : "库存急缺"}
      </span>
    );
  };

  const getUsagePercent = (stock: number, capacity: number) => Math.round((stock / capacity) * 100);

  const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
  const totalCapacity = inventory.reduce((sum, item) => sum + item.capacity, 0);
  const totalRestock = inventory.filter((i) => i.status !== "normal").length;

  return (
    <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 page-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">仓管中心</h1>
          <p className="text-slate-500 text-sm mt-1">实时监控库存状态</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">添加商品</span>
          <span className="sm:hidden">添加</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-slate-500 text-xs sm:text-sm truncate">总库存容量</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-3xl font-bold text-slate-800">{totalCapacity}</span>
                <span className="text-slate-400 text-xs">件</span>
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-violet-100 text-violet-600 shrink-0">
              <Package2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-slate-500 text-xs sm:text-sm truncate">当前库存剩余</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-3xl font-bold text-slate-800">{totalStock}</span>
                <span className="text-slate-400 text-xs">件</span>
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-orange-100 text-orange-600 shrink-0">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-slate-500 text-xs sm:text-sm truncate">商品种类</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-3xl font-bold text-slate-800">{inventory.length}</span>
                <span className="text-slate-400 text-xs">种</span>
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-slate-500 text-xs sm:text-sm truncate">库存预警</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-3xl font-bold text-slate-800">{totalRestock}</span>
                <span className="text-slate-400 text-xs">项</span>
              </div>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-red-100 text-red-600 shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-200/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索商品..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 w-40" onClick={() => handleSort("name")}>
                  <div className="flex items-center justify-center gap-1">商品<ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 w-20" onClick={() => handleSort("category")}>分类</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 w-24" onClick={() => handleSort("stock")}>库存</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-32">容量</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-20">进货</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-24">状态</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-16">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-24 animate-pulse mx-auto" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse mx-auto" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-20 animate-pulse mx-auto" /></td>
                    <td className="px-3 py-4"><div className="h-1.5 bg-slate-200 rounded w-16 animate-pulse mx-auto" /></td>
                    <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-12 animate-pulse mx-auto" /></td>
                    <td className="px-3 py-4"><div className="h-5 bg-slate-200 rounded-full w-16 animate-pulse mx-auto" /></td>
                    <td className="px-3 py-4"><div className="h-6 w-6 bg-slate-200 rounded animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : (
                paginatedInventory.map((item) => {
                  const usagePercent = getUsagePercent(item.stock, item.capacity);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3 text-center"><span className="font-medium text-slate-800 text-sm">{item.name}</span></td>
                      <td className="px-3 py-3 text-center"><span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{item.category}</span></td>
                      <td className="px-3 py-3 text-center"><span className="font-semibold text-slate-800">{item.stock}</span><span className="text-slate-400 text-xs">/{item.capacity}</span></td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full"><div className={`h-full rounded-full ${usagePercent > 80 ? 'bg-emerald-500' : usagePercent > 40 ? 'bg-violet-500' : 'bg-orange-500'}`} style={{width: `${usagePercent}%`}} /></div>
                          <span className="text-xs text-slate-500">{usagePercent}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center"><span className="text-orange-600 font-medium text-sm">+{item.restock_qty}</span></td>
                      <td className="px-3 py-3 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => handleDeleteItem(item)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-slate-100">
          {paginatedInventory.map((item) => {
            const usagePercent = getUsagePercent(item.stock, item.capacity);
            return (
              <div key={item.id} className="p-3 hover:bg-slate-50/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 text-sm truncate">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <button onClick={() => handleDeleteItem(item)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{item.category}</span>
                    <span className="text-slate-500">库存: <span className="font-medium text-slate-700">{item.stock}/{item.capacity}</span></span>
                  </div>
                  <span className="text-orange-600 font-medium">+{item.restock_qty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${usagePercent > 80 ? 'bg-emerald-500' : usagePercent > 40 ? 'bg-violet-500' : 'bg-orange-500'}`} style={{width: `${usagePercent}%`}} />
                  </div>
                  <span className="text-xs text-slate-500 w-8">{usagePercent}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredInventory.length === 0 && !loading && (
          <div className="p-8 text-center">
            <Package2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">暂无匹配的商品</p>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="px-4 py-3 border-t border-slate-200/60 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              共 <span className="font-medium text-slate-700">{filteredInventory.length}</span> 件商品，第 
              <span className="font-medium text-slate-700"> {currentPage}/{totalPages} </span> 页
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    page === currentPage
                      ? "bg-violet-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">添加商品</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">商品名称 *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="请输入商品名称"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">分类</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">当前库存</label>
                  <input
                    type="number"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">库存容量</label>
                  <input
                    type="number"
                    value={newItem.capacity}
                    onChange={(e) => setNewItem({ ...newItem, capacity: Math.max(1, parseInt(e.target.value) || 1) })}
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name.trim()}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                添加商品
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">确认删除</h3>
              <p className="text-slate-500 text-sm mb-6">
                确定要删除商品 <span className="font-medium text-slate-700">{deleteItem.name}</span> 吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteItem(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      删除中...
                    </>
                  ) : (
                    '删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}