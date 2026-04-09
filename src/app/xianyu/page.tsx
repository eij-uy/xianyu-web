'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  X,
  Trash2,
  Undo2,
  Percent,
  ArrowLeft,
  Eye,
  Edit,
  AlertTriangle,
} from 'lucide-react';

interface XianyuAccount {
  id: number;
  cookie: string;
  nickname: string;
  account_id: string;
  avatar: string;
  created_at: string;
  today_gmv: number;
  today_orders: number;
  today_refunds: number;
  total_gmv: number;
  total_orders: number;
  products: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sold: number;
  likes: number;
  status: '在售' | '已售' | '下架';
}

interface CrawlerGood {
  cardData?: {
    itemStatus?: number;
  };
}

interface CrawlerResponse {
  cardList?: CrawlerGood[];
}



export default function XianyuPage() {
  const [accounts, setAccounts] = useState<XianyuAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({ cookie: '' });
  const [deleteAccount, setDeleteAccount] = useState<XianyuAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editAccount, setEditAccount] = useState<XianyuAccount | null>(null);

  const formatGmv = (value: number) => {
    if (value >= 10000) return (value / 10000).toFixed(1) + 'w';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
    return value.toString();
  };

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => { setAccounts(data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch accounts:', err); setLoading(false); });
  }, []);

  const handleAddAccount = async () => {
    if (!newAccount.cookie.trim()) return;
    try {
      const [userInfoRes, userIdRes, goodsRes] = await Promise.all([
        fetch(`/api/crawler/user-info?cookie=${encodeURIComponent(newAccount.cookie)}`),
        fetch(`/api/crawler/user-id?cookie=${encodeURIComponent(newAccount.cookie)}`),
        fetch(`/api/crawler/goods?cookie=${encodeURIComponent(newAccount.cookie)}&page=1&limit=20`)
      ]);
      
      if (!userInfoRes.ok) throw new Error('获取用户信息失败');
      const userInfo = await userInfoRes.json();
      
      if (!userIdRes.ok) throw new Error('获取用户ID失败');
      const userIdData = await userIdRes.json();
      
      if (!goodsRes.ok) throw new Error('获取商品列表失败');
      const goodsData = await goodsRes.json();
      
      const goods = goodsData?.cardList || [];
      const sellingGoods = goods.filter((item: CrawlerGood) => item.cardData?.itemStatus === 1);
      
      const accountData = {
        cookie: newAccount.cookie.trim(),
        nickname: userInfo?.module?.base?.displayName || '',
        account_id: userIdData?.userId?.toString() || '',
        avatar: userInfo?.module?.base?.avatar || '',
        products: sellingGoods.length
      };
      
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });
      if (!res.ok) throw new Error('保存账号失败');
      const account = await res.json();
      setAccounts([...accounts, account]);
      setNewAccount({ cookie: '' });
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add account:', err);
      alert('添加账号失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleDeleteAccount = (account: XianyuAccount) => {
    setDeleteAccount(account);
  };

  const confirmDelete = async () => {
    if (deleteAccount) {
      setIsDeleting(true);
      try {
        await fetch(`/api/accounts/${deleteAccount.id}`, { method: 'DELETE' });
        await new Promise(resolve => setTimeout(resolve, 300));
        setAccounts(accounts.filter(a => a.id !== deleteAccount.id));
        setDeleteAccount(null);
      } catch (err) {
        console.error('Failed to delete account:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const router = useRouter();
  
  const handleViewAccount = (account: XianyuAccount) => {
    router.push('/xianyu/' + account.id);
  };

  return (
    <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 page-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">闲鱼数据</h1>
          <p className="text-slate-500 text-sm mt-1">管理闲鱼账号</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">添加账号</span>
          <span className="sm:hidden">添加</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/60">
          <h3 className="font-semibold text-slate-800">闲鱼账号列表</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse" />
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-24 animate-pulse mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-32 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center">
              <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">暂无添加的账号</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {account.avatar ? (
                      <img 
                        src={account.avatar} 
                        alt={account.nickname}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-violet-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-800">{account.nickname || '未获取昵称'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">添加时间: {new Date(account.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditAccount(account)}
                      className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewAccount(account)}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors cursor-pointer text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditAccount(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">编辑闲鱼账号</h2>
              <button onClick={() => setEditAccount(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">昵称</label>
                <input
                  type="text"
                  value={editAccount.nickname}
                  onChange={(e) => setEditAccount({ ...editAccount, nickname: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">头像URL</label>
                <input
                  type="text"
                  value={editAccount.avatar || ''}
                  onChange={(e) => setEditAccount({ ...editAccount, avatar: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
                {editAccount.avatar && (
                  <img src={editAccount.avatar} alt="预览" className="w-12 h-12 rounded-full mt-2 object-cover" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cookie</label>
                <textarea
                  value={editAccount.cookie}
                  onChange={(e) => setEditAccount({ ...editAccount, cookie: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none font-mono text-xs"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setEditAccount(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/accounts/${editAccount.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        nickname: editAccount.nickname,
                        avatar: editAccount.avatar,
                        cookie: editAccount.cookie
                      }),
                    });
                    if (res.ok) {
                      setAccounts(accounts.map(a => a.id === editAccount.id ? { ...a, ...editAccount } : a));
                      setEditAccount(null);
                    }
                  } catch (err) {
                    console.error('Failed to update account:', err);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors cursor-pointer"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">添加闲鱼账号</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cookie *</label>
                <textarea
                  value={newAccount.cookie}
                  onChange={(e) => setNewAccount({ cookie: e.target.value })}
                  placeholder="请粘贴闲鱼Cookie"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none font-mono text-xs"
                />
                <p className="text-xs text-slate-400 mt-1">登录闲鱼后，在浏览器开发者工具中获取Cookie</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newAccount.cookie.trim()}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                添加账号
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteAccount(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">确认删除</h3>
              <p className="text-slate-500 text-sm mb-6">
                确定要删除账号 <span className="font-medium text-slate-700">{deleteAccount.nickname || deleteAccount.account_id || '该账号'}</span> 吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteAccount(null)}
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