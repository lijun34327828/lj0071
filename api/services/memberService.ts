import db from '../db/index.js';
import type { Member, CheckinRecord, MemberListResponse } from '../../shared/types.js';
import { getPackageById, formatDate } from '../config/packages.js';

interface MemberRow {
  id: number;
  name: string;
  phone: string;
  gender: string;
  total_hours: number;
  remaining_hours: number;
  card_type: string;
  card_package: string;
  expire_date: string;
  created_at: string;
}

function mapMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    gender: row.gender as Member['gender'],
    totalHours: row.total_hours,
    remainingHours: row.remaining_hours,
    cardType: row.card_type as Member['cardType'],
    cardPackage: row.card_package,
    expireDate: row.expire_date,
    createdAt: row.created_at,
  };
}

export function createMember(
  name: string,
  phone: string,
  gender: Member['gender'],
  packageId: string,
): Member {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    throw new Error('套餐不存在');
  }

  const existing = db.prepare('SELECT id FROM members WHERE phone = ?').get(phone);
  if (existing) {
    throw new Error('该手机号已注册会员');
  }

  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + pkg.durationDays);

  const stmt = db.prepare(`
    INSERT INTO members (name, phone, gender, total_hours, remaining_hours, card_type, card_package, expire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name,
    phone,
    gender,
    pkg.hours,
    pkg.hours,
    pkg.type,
    pkg.name,
    formatDate(expireDate),
  );

  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid) as MemberRow;
  return mapMemberRow(row);
}

export function getMemberList(
  page: number,
  pageSize: number,
  keyword: string,
): MemberListResponse {
  const offset = (page - 1) * pageSize;
  let whereClause = '';
  const params: unknown[] = [];

  if (keyword.trim()) {
    whereClause = 'WHERE name LIKE ? OR phone LIKE ?';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM members ${whereClause}`)
    .get(...params) as { total: number };

  const rows = db
    .prepare(
      `SELECT * FROM members ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as MemberRow[];

  return {
    list: rows.map(mapMemberRow),
    total: countRow.total,
  };
}

export function getMemberByPhone(phone: string): Member | null {
  const row = db.prepare('SELECT * FROM members WHERE phone = ?').get(phone) as MemberRow | undefined;
  return row ? mapMemberRow(row) : null;
}

export function getMemberById(id: number): Member | null {
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow | undefined;
  return row ? mapMemberRow(row) : null;
}

interface CheckinResult {
  success: boolean;
  message: string;
  remainingHours: number;
}

export function checkinMember(memberId: number): CheckinResult {
  const member = getMemberById(memberId);
  if (!member) {
    return { success: false, message: '会员不存在', remainingHours: 0 };
  }

  const today = formatDate(new Date());
  if (member.expireDate < today) {
    return { success: false, message: '会员卡已过期', remainingHours: member.remainingHours };
  }

  if (member.remainingHours <= 0) {
    return { success: false, message: '剩余课时不足，核销已被拦截', remainingHours: 0 };
  }

  const newRemaining = member.remainingHours - 1;

  db.prepare('UPDATE members SET remaining_hours = ? WHERE id = ?').run(newRemaining, memberId);
  db.prepare(
    'INSERT INTO checkin_records (member_id, member_name, remaining_after) VALUES (?, ?, ?)',
  ).run(memberId, member.name, newRemaining);

  return {
    success: true,
    message: `核销成功，剩余课时：${newRemaining}`,
    remainingHours: newRemaining,
  };
}

export function getCheckinRecords(memberId?: number): CheckinRecord[] {
  let rows: { id: number; member_id: number; member_name: string; checkin_time: string; remaining_after: number }[];
  if (memberId) {
    rows = db
      .prepare('SELECT * FROM checkin_records WHERE member_id = ? ORDER BY checkin_time DESC')
      .all(memberId) as typeof rows;
  } else {
    rows = db.prepare('SELECT * FROM checkin_records ORDER BY checkin_time DESC LIMIT 100').all() as typeof rows;
  }
  return rows.map((r) => ({
    id: r.id,
    memberId: r.member_id,
    memberName: r.member_name,
    checkinTime: r.checkin_time,
    remainingAfter: r.remaining_after,
  }));
}
