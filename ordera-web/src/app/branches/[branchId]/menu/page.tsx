'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Category, MenuItem, StockStatus } from '@/types/ordera';
import {
  UtensilsCrossed,
  Plus,
  MoreVertical,
  Search,
  FolderPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function MenuAndStock() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // --- DATA FETCHING ---

  const { data: categories = [], isLoading: isLoadingCats } = useQuery({
    queryKey: ['branch-categories', branchId],
    queryFn: async () => {
      return api.get<Category[]>(`/api/menu/categories`);
    },
  });

  const { data: rawItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ['branch-items', selectedCategory?._id],
    queryFn: async () => {
      return api.get<any>(`/api/menu/categories/${selectedCategory?._id}/items`);
    },
    enabled: !!selectedCategory?._id,
    staleTime: 0,
  });
  const items: MenuItem[] = Array.isArray(rawItems) ? rawItems : [];

  // Auto-select first category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // --- MUTATIONS ---

  const stockMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StockStatus }) => {
      return api.patch(`/api/menu/items/${id}/stock`, { status });
    },
    onSuccess: () => {
      toast.success('Stock updated');
      queryClient.invalidateQueries({ queryKey: ['branch-items'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update stock')
  });

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-6">

      {/* ── LEFT PANE: Categories ── */}
      <div className={`
        w-full lg:w-72 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden shrink-0 transition-all duration-300
        ${isCollapsed ? 'h-[88px] lg:h-full' : 'h-[300px] lg:h-full'}
      `}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-[#1A1A2E]">Menu</h2>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="lg:hidden p-1.5 bg-gray-50 text-gray-400 hover:text-[#C97B2A] rounded-lg transition-colors"
              >
                {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="p-2 bg-gray-50 text-gray-500 hover:bg-[#C97B2A] hover:text-white rounded-xl transition-colors"
            >
              <FolderPlus size={18} />
            </button>
          </div>
          {!isCollapsed && <p className="text-xs text-gray-400 lg:block">Manage your branch categories.</p>}
          <p className="hidden lg:block text-xs text-gray-400">Manage your categories.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoadingCats ? (
            <div className="space-y-2 p-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
            </div>
          ) : categories.length > 0 ? (
            categories.map((cat: Category) => (
              <button
                key={cat._id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsCollapsed(true); // Auto-collapse on selection for better mobile flow
                }}
                className={`
                  w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex justify-between items-center
                  ${selectedCategory?._id === cat._id
                    ? 'bg-[#1A1A2E] text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-muted'}
                `}
              >
                {cat.name}
              </button>
            ))
          ) : (
            <div className="text-center p-6 text-gray-400 text-sm">
              No categories found. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: Items Grid ── */}
      <div className={`flex-1 flex flex-col bg-transparent transition-all duration-300 ${isCollapsed ? 'mt-4' : 'mt-8'} lg:mt-0`}>
        {selectedCategory ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-3xl text-[#1A1A2E]">{selectedCategory.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Manage items and stock levels</p>
              </div>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C97B2A] text-white rounded-xl font-bold shadow-sm hover:bg-[#B86A19] transition-all"
              >
                <Plus size={18} /> New Item
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-12">
              {isLoadingItems ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl" />)}
                </div>
              ) : items.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {items.map((item: MenuItem) => (
                    <div key={item._id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-muted leading-tight">{item.name}</h3>
                          <p className="text-[#C97B2A] font-display text-xl mt-1">₦{(item.price.amount / 100).toLocaleString()}</p>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock Level</span>
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
                          <StockButton
                            label="Avail"
                            status={StockStatus.AVAILABLE}
                            current={item.stockStatus}
                            onClick={() => stockMutation.mutate({ id: item._id, status: StockStatus.AVAILABLE })}
                            loading={stockMutation.isPending && stockMutation.variables?.id === item._id}
                          />
                          <StockButton
                            label="Low"
                            status={StockStatus.LOW}
                            current={item.stockStatus}
                            onClick={() => stockMutation.mutate({ id: item._id, status: StockStatus.LOW })}
                            loading={stockMutation.isPending && stockMutation.variables?.id === item._id}
                          />
                          <StockButton
                            label="Finished"
                            status={StockStatus.FINISHED}
                            current={item.stockStatus}
                            onClick={() => stockMutation.mutate({ id: item._id, status: StockStatus.FINISHED })}
                            loading={stockMutation.isPending && stockMutation.variables?.id === item._id}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-100 border-dashed rounded-3xl py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <UtensilsCrossed size={24} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-muted">No items in {selectedCategory.name}</h3>
                  <p className="text-sm text-gray-400 mt-1 max-w-sm">Add menu items to this category so your waiters can start taking orders.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UtensilsCrossed size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-display text-muted">Select a Category</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">Choose a category from the left pane to manage its items and stock.</p>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['branch-categories', branchId] });
          setIsCategoryModalOpen(false);
        }}
      />

      <CreateItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        categoryId={selectedCategory?._id || ''}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['branch-items'] });
          setIsItemModalOpen(false);
        }}
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StockButton({ label, status, current, onClick, loading }: any) {
  const isActive = status === current;
  let activeClass = 'bg-gray-200 text-gray-500';
  let Icon = null;

  if (isActive) {
    if (status === StockStatus.AVAILABLE) {
      activeClass = 'bg-green-500 text-white shadow-sm';
      Icon = CheckCircle2;
    } else if (status === StockStatus.LOW) {
      activeClass = 'bg-amber-500 text-white shadow-sm';
      Icon = AlertTriangle;
    } else {
      activeClass = 'bg-red-500 text-white shadow-sm';
      Icon = XCircle;
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={isActive || loading}
      className={`
        px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5
        ${isActive ? activeClass : 'text-gray-400 hover:bg-gray-100'}
        ${loading ? 'opacity-50' : ''}
      `}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : isActive && Icon ? <Icon size={12} /> : null}
      <span>{label}</span>
    </button>
  );
}

// Modal: Create Category
function CreateCategoryModal({ isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/api/menu/categories', { name, isActive: true });
      toast.success('Category created');
      setName('');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">New Category</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Category Name</label>
            <input
              required autoFocus
              placeholder="e.g. Grills & Protein"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-sm"
            />
          </div>
          <button
            type="submit" disabled={isLoading}
            className="w-full py-3 bg-[#1A1A2E] text-white rounded-2xl font-bold hover:bg-[#2A2A4E] transition-all disabled:opacity-50"
          >
            <span>{isLoading ? 'Creating...' : 'Create Category'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// Modal: Create Item
function CreateItemModal({ isOpen, onClose, categoryId, onSuccess }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return toast.error('No category selected');
    setIsLoading(true);
    try {
      const amount = Math.round(parseFloat(price) * 100);
      await api.post('/api/menu/items', {
        name,
        categoryId,
        price: { amount, currency: 'NGN' },
        stockStatus: StockStatus.AVAILABLE,
        isActive: true
      });
      toast.success('Item created');
      setName(''); setPrice('');
      onSuccess(categoryId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create item');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">New Menu Item</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Item Name</label>
            <input
              required autoFocus
              placeholder="e.g. Jollof Rice"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Price (₦)</label>
            <input
              required type="number" min="0" step="0.01"
              placeholder="e.g. 2500"
              value={price} onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-sm"
            />
          </div>
          <button
            type="submit" disabled={isLoading}
            className="w-full py-3 bg-[#C97B2A] text-white rounded-2xl font-bold shadow-md hover:bg-[#B86A19] transition-all disabled:opacity-50"
          >
            <span>{isLoading ? 'Saving...' : 'Save Item'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
