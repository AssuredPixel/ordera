import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { Order } from '@/types/ordera';

// --- Queries ---

/**
 * Fetch active orders for the current branch/user
 */
export function useActiveOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders', 'active'],
    queryFn: () => api.get('/api/ordering/active'),
  });
}

/**
 * Fetch specific order details
 */
export function useOrder(orderId: string) {
  return useQuery<Order>({
    queryKey: ['orders', orderId],
    queryFn: () => api.get(`/api/ordering/${orderId}`),
    enabled: !!orderId,
  });
}

/**
 * Fetch menu categories and items
 */
export function useMenu() {
  return useQuery<any[]>({
    queryKey: ['menu'],
    queryFn: () => api.get('/api/menu/categories'),
  });
}

// --- Mutations ---

/**
 * Create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { tableNumber?: string; notes?: string }) => 
      api.post<Order>('/api/ordering', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
    },
  });
}

/**
 * Update order status (e.g. send to kitchen)
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch<Order>(`/api/ordering/${orderId}/status`, { status }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
    },
  });
}

/**
 * Add item to order with OPTIMISTIC UPDATE
 */
export function useAddItemToOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: any }) =>
      api.post<Order>(`/api/ordering/${orderId}/items`, data),
    
    // Optimistic Update
    onMutate: async ({ orderId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['orders', orderId] });
      const previousOrder = queryClient.getQueryData<Order>(['orders', orderId]);

      if (previousOrder) {
        queryClient.setQueryData(['orders', orderId], {
          ...previousOrder,
          items: [...previousOrder.items, { ...data, isOptimistic: true }],
        });
      }

      return { previousOrder };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['orders', variables.orderId], context.previousOrder);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
    },
  });
}

/**
 * Fetch waiter-specific statistics
 */
export function useWaiterStats(branchId: string) {
  return useQuery<any>({
    queryKey: ['waiter-stats', branchId],
    queryFn: () => api.get<any>('/api/waiter/stats'),
    enabled: !!branchId,
  });
}

/**
 * Fetch active bills for the branch
 */
export function useBills(branchId: string) {
  return useQuery<any[]>({
    queryKey: ['bills', 'active', branchId],
    queryFn: () => api.get<any[]>('/api/bills'),
    enabled: !!branchId,
  });
}

/**
 * Charge a bill
 */
export function useChargeBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, data }: { billId: string; data: any }) =>
      api.post(`/api/bills/${billId}/charge`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-stats'] });
    },
  });
}
