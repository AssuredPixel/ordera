'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatDistanceToNow } from 'date-fns';
import { useRealtime } from '@/lib/realtime-hook';
import Link from 'next/link';

export enum NotificationType {
  ORDER_READY = 'ORDER_READY',
  LOW_STOCK = 'LOW_STOCK',
  FINISHED_STOCK = 'FINISHED_STOCK',
  NEW_MESSAGE = 'NEW_MESSAGE',
}

interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  relatedOrderId?: string;
  relatedThreadId?: string;
}

export const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();

  const fetchNotifications = async () => {
    try {
      const data = await api.get<Notification[]>('/api/notifications/all?limit=20');
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Notifications fetch failed or timed out:', err);
      // Don't crash the UI, just show empty
    }
  };

  const fetchCount = async () => {
    try {
      const res = await api.get<{ count: number }>('/api/notifications/count');
      if (res && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch (err) {
      console.warn('Notification count fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchCount();

    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useRealtime(`user-${user?.userId}`, 'notification:new', (newNotif: Notification) => {
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_READY:
        return 'bg-amber-50/50 hover:bg-amber-50 border-amber-100';
      case NotificationType.LOW_STOCK:
        return 'bg-amber-50/50 hover:bg-amber-50 border-amber-100';
      case NotificationType.FINISHED_STOCK:
        return 'bg-red-50/50 hover:bg-red-50 border-red-100';
      default:
        return 'bg-white hover:bg-gray-50 border-gray-100';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_READY:
        return <Bell className="text-amber-500" size={18} />;
      case NotificationType.LOW_STOCK:
        return <AlertTriangle className="text-amber-500" size={18} />;
      case NotificationType.FINISHED_STOCK:
        return <AlertCircle className="text-red-500" size={18} />;
      case NotificationType.NEW_MESSAGE:
        return <MessageSquare className="text-blue-500" size={18} />;
      default:
        return <Info className="text-gray-400" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button
      onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-2.5 rounded-xl bg-white border border-gray-100 text-muted hover:bg-gray-50 transition-all shadow-sm active:scale-95 z-[51]"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-display text-lg text-[#1A1A2E]">Notifications</h3>
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-[#C97B2A] hover:underline"
              >
                Mark all read
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => markAsRead(notif._id)}
                      className={`p-4 transition-colors cursor-pointer border-l-4 ${
                        notif.isRead ? 'border-transparent opacity-70' : 'border-[#C97B2A]'
                      } ${getNotificationStyle(notif.type)}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1A1A2E]">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notif.body}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-medium">
                            {formatDistanceToNow(new Date(notif.createdAt))} ago
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
               <button className="text-xs text-muted font-medium hover:text-[#C97B2A]">
                  View all activity
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
