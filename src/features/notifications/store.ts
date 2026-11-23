import { create } from "zustand";
import type { AppNotification } from "./types";

interface NotificationState {
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const sampleNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "Invoice Paid",
    message: "Acme Labs paid $5,200.00 for Invoice INV-0238.",
    timestamp: "10 mins ago",
    read: false,
    type: "payment",
  },
  {
    id: "notif-2",
    title: "OCR Scan Confirmed",
    message: "Office Depot receipt ($135.70) verified and recorded.",
    timestamp: "1 hour ago",
    read: false,
    type: "scan",
  },
  {
    id: "notif-3",
    title: "Tax Deadline Alert",
    message: "Q4 estimated state sales tax return due in 14 days.",
    timestamp: "Yesterday",
    read: true,
    type: "tax",
  },
  {
    id: "notif-4",
    title: "Accountant Joined",
    message: "Sarah Chen, CPA accepted your team invitation.",
    timestamp: "2 days ago",
    read: true,
    type: "team",
  },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: sampleNotifications,

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));
