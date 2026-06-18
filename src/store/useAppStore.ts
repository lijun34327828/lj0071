import { create } from 'zustand';
import type { Member, Package, CheckinRecord, MemberStats } from '../../shared/types.js';
import { api } from '@/services/api';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppState {
  packages: Package[];
  members: Member[];
  memberTotal: number;
  memberStats: MemberStats;
  checkinRecords: CheckinRecord[];
  toasts: Toast[];

  loadPackages: () => Promise<void>;
  loadMembers: (page?: number, pageSize?: number, keyword?: string) => Promise<void>;
  loadMemberStats: () => Promise<void>;
  searchMemberByPhone: (phone: string) => Promise<Member | null>;
  createMember: (data: { name: string; phone: string; gender: Member['gender']; packageId: string }) => Promise<Member>;
  doCheckin: (memberId: number) => Promise<{ success: boolean; message: string; remainingHours: number }>;
  loadCheckinRecords: (memberId?: number) => Promise<void>;

  showToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: number) => void;
}

let toastId = 0;

export const useAppStore = create<AppState>((set, get) => ({
  packages: [],
  members: [],
  memberTotal: 0,
  memberStats: { total: 0, active: 0, zeroHours: 0, expired: 0 },
  checkinRecords: [],
  toasts: [],

  loadPackages: async () => {
    const packages = await api.getPackages();
    set({ packages });
  },

  loadMembers: async (page = 1, pageSize = 10, keyword = '') => {
    const result = await api.getMembers(page, pageSize, keyword);
    set({ members: result.list, memberTotal: result.total });
  },

  loadMemberStats: async () => {
    const stats = await api.getMemberStats();
    set({ memberStats: stats });
  },

  searchMemberByPhone: async (phone: string) => {
    return await api.getMemberByPhone(phone);
  },

  createMember: async (data) => {
    const member = await api.createMember(data);
    get().showToast('success', `会员 ${member.name} 办卡成功！`);
    return member;
  },

  doCheckin: async (memberId: number) => {
    const result = await api.checkin(memberId);
    if (result.success) {
      get().showToast('success', result.message);
    } else {
      get().showToast('error', result.message);
    }
    return result;
  },

  loadCheckinRecords: async (memberId) => {
    const records = await api.getCheckinRecords(memberId);
    set({ checkinRecords: records });
  },

  showToast: (type, message) => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => get().removeToast(id), 3000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
