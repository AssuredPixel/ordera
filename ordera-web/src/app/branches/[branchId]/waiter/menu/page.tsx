'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  ShoppingBag,
  X,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { StockStatus } from '@/types/ordera';
import Link from 'next/link';

export default function WaiterMenuPage() {
  return (
    <Suspense fallback={<div>Loading menu...</div>}>
      <WaiterMenuContent />
    </Suspense>
  );
}

function WaiterMenuContent() {
  const { branchId } = useParams();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => api.get<any[]>('/api/menu/categories'),
  });

  // 2. Fetch Items
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['items', selectedCategoryId || 'all', branchId],
    queryFn: () => selectedCategoryId 
      ? api.get<any[]>(`/api/menu/categories/${selectedCategoryId}/items`)
      : Promise.resolve([]),
    enabled: !!selectedCategoryId
  });

  // Set first category as default if none selected
  if (!selectedCategoryId && categories.length > 0) {
    setSelectedCategoryId(categories[0]._id);
  }

  const addItemMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/orders/${orderId}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast.success('Item added to order');
      setSelectedItem(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add item')
  });

  const filteredItems = items.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => orderId ? router.push(`/branches/${branchId}/waiter/orders/${orderId}`) : router.push(`/branches/${branchId}/waiter`)}
            className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-muted transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="font-display text-3xl text-[#1A1A2E]">Menu</h1>
            {orderId && (
              <p className="text-[#C97B2A] text-xs font-bold uppercase tracking-wider">
                Adding to Order #{orderId.slice(-6).toUpperCase()}
              </p>
            )}
          </div>
        </div>
        {orderId && (
          <Link 
            href={`/branches/${branchId}/waiter/orders/${orderId}`}
            className="p-4 bg-[#1A1A2E] text-white rounded-2xl shadow-lg flex items-center gap-2"
          >
            <ShoppingBag size={20} /> View Order
          </Link>
        )}
      </div>

      {/* ── SEARCH & CATEGORIES ── */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text"
            placeholder="Search for items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] shadow-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === cat._id 
                  ? 'bg-[#1A1A2E] text-white shadow-lg shadow-[#1A1A2E]/20' 
                  : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── ITEMS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoadingItems ? (
          [1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-square bg-white rounded-3xl border border-gray-100 animate-pulse" />)
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item: any) => (
            <button
              key={item._id}
              onClick={() => setSelectedItem(item)}
              className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#C97B2A]/30 transition-all text-left flex flex-col h-full group"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-muted text-sm leading-snug group-hover:text-[#C97B2A] transition-colors">{item.name}</h4>
                  {item.stockStatus === StockStatus.LOW && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black rounded uppercase">Low</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                <span className="font-display text-[#1A1A2E]">₦{(item.price.amount / 100).toLocaleString()}</span>
                <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-[#C97B2A] group-hover:text-white transition-all">
                  <Plus size={14} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-400 italic">
            No items found in this category.
          </div>
        )}
      </div>

      {/* ── ITEM SELECTION MODAL ── */}
      {selectedItem && (
        <ItemSelectionModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onAdd={(data) => addItemMutation.mutate(data)}
          isLoading={addItemMutation.isPending}
          canAdd={!!orderId}
        />
      )}
    </div>
  );
}

function ItemSelectionModal({ item, onClose, onAdd, isLoading, canAdd }: any) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    const addonsPrice = selectedAddons.reduce((acc, id) => {
      const addon = item.addons.find((a: any) => a._id === id);
      return acc + (addon?.price.amount || 0);
    }, 0);
    return (item.price.amount + addonsPrice) * quantity;
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A2E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div>
            <h2 className="font-display text-3xl text-[#1A1A2E]">{item.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white text-gray-400 hover:text-red-500 shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-8">
          {/* Addons */}
          {item.addons?.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Addons</h4>
              <div className="space-y-2">
                {item.addons.map((addon: any) => (
                  <button
                    key={addon._id}
                    onClick={() => toggleAddon(addon._id)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      selectedAddons.includes(addon._id)
                        ? 'border-[#C97B2A] bg-[#C97B2A]/5 text-[#C97B2A]'
                        : 'border-gray-100 hover:border-gray-200 text-muted'
                    }`}
                  >
                    <span className="font-bold text-sm">{addon.name}</span>
                    <span className="text-sm">
                      {selectedAddons.includes(addon._id) && '✓ '} 
                      + ₦{(addon.price.amount / 100).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Special Instructions</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra spicy, no onions..."
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#C97B2A] text-sm"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between pt-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity</h4>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-muted hover:bg-gray-200 transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="text-2xl font-display text-[#1A1A2E]">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-12 h-12 rounded-xl bg-[#1A1A2E] flex items-center justify-center text-white shadow-lg shadow-[#1A1A2E]/20 hover:bg-[#2A2A4E]"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-[#1A1A2E] text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Price</p>
            <p className="text-3xl font-display text-[#C97B2A]">₦{(calculateTotal() / 100).toLocaleString()}</p>
          </div>
          {canAdd ? (
            <button 
              onClick={() => onAdd({ menuItemId: item._id, quantity, selectedAddons, notes })}
              disabled={isLoading}
              className="px-8 py-4 bg-[#C97B2A] text-white rounded-2xl font-bold shadow-lg shadow-[#C97B2A]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add to Order'}
            </button>
          ) : (
            <p className="text-xs text-white/60 italic max-w-[150px] text-right">Start a new order to add this item.</p>
          )}
        </div>
      </div>
    </div>
  );
}
