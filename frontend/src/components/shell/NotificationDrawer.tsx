import { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Bell, AlertTriangle, Info, CheckCircle2, Check } from 'lucide-react';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationDrawer({ isOpen, onClose, onUnreadCountChange }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
      const unread = data.filter((n: any) => !n.isRead).length;
      if (onUnreadCountChange) onUnreadCountChange(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      const remaining = notifications.filter((n) => n.id !== id && !n.isRead).length;
      if (onUnreadCountChange) onUnreadCountChange(remaining);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-brand-600" />;
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Operational Notifications" subtitle="Real-time alerts and system events" width="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-600">
            {notifications.filter((n) => !n.isRead).length} Unread Notifications
          </span>
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} leftIcon={<Check className="w-3.5 h-3.5" />}>
            Mark all read
          </Button>
        </div>

        {loading && <div className="text-center py-8 text-xs text-slate-400">Loading alerts...</div>}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No notifications at this time
          </div>
        )}

        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                n.isRead
                  ? 'bg-white border-slate-200/70 text-slate-600 opacity-75'
                  : 'bg-brand-50/40 border-brand-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-900 text-xs truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
