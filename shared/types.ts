export interface Member {
  id: number;
  name: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  totalHours: number;
  remainingHours: number;
  cardType: 'times' | 'monthly';
  cardPackage: string;
  expireDate: string;
  createdAt: string;
}

export interface CheckinRecord {
  id: number;
  memberId: number;
  memberName: string;
  checkinTime: string;
  remainingAfter: number;
}

export interface Package {
  id: string;
  name: string;
  type: 'times' | 'monthly';
  hours: number;
  durationDays: number;
  price: number;
}

export interface CreateMemberRequest {
  name: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  packageId: string;
}

export interface CheckinRequest {
  memberId: number;
}

export interface CheckinResponse {
  success: boolean;
  message: string;
  remainingHours: number;
}

export interface MemberListResponse {
  list: Member[];
  total: number;
}
