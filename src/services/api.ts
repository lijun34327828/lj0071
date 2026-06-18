import type {
  Member,
  Package,
  CheckinRecord,
  CreateMemberRequest,
  CheckinResponse,
  MemberListResponse,
  MemberStats,
} from '../../shared/types.js';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const api = {
  getPackages: () => request<Package[]>('/api/packages'),

  createMember: (data: CreateMemberRequest) =>
    request<Member>('/api/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMembers: (page = 1, pageSize = 10, keyword = '') =>
    request<MemberListResponse>(
      `/api/members?page=${page}&pageSize=${pageSize}&keyword=${encodeURIComponent(keyword)}`,
    ),

  getMemberByPhone: (phone: string) =>
    request<Member | null>(`/api/members/phone/${encodeURIComponent(phone)}`),

  checkin: (memberId: number) =>
    request<CheckinResponse>('/api/checkin', {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    }),

  getCheckinRecords: (memberId?: number) =>
    request<CheckinRecord[]>(
      memberId ? `/api/checkin-records?memberId=${memberId}` : '/api/checkin-records',
    ),

  getMemberStats: () => request<MemberStats>('/api/members/stats'),
};
