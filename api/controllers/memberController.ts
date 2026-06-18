import { Request, Response } from 'express';
import { PACKAGES } from '../config/packages.js';
import {
  createMember,
  getMemberList,
  getMemberByPhone,
  checkinMember,
  getCheckinRecords,
  getMemberStats,
} from '../services/memberService.js';
import type { CreateMemberRequest } from '../../shared/types.js';

export function getPackages(_req: Request, res: Response) {
  res.json(PACKAGES);
}

export function registerMember(req: Request, res: Response) {
  try {
    const { name, phone, gender, packageId } = req.body as CreateMemberRequest;
    if (!name || !phone || !packageId) {
      res.status(400).json({ error: '缺少必填参数' });
      return;
    }
    const member = createMember(name, phone, gender ?? 'other', packageId);
    res.json(member);
  } catch (err) {
    console.error('[registerMember]', err);
    const message = err instanceof Error ? err.message : '创建会员失败';
    res.status(400).json({ error: message });
  }
}

export function listMembers(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const keyword = (req.query.keyword as string) || '';
    const result = getMemberList(page, pageSize, keyword);
    res.json(result);
  } catch (err) {
    console.error('[listMembers]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '查询会员列表失败' });
  }
}

export function findMemberByPhone(req: Request, res: Response) {
  try {
    const { phone } = req.params;
    const member = getMemberByPhone(phone);
    res.json(member);
  } catch (err) {
    console.error('[findMemberByPhone]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '查询会员失败' });
  }
}

export function doCheckin(req: Request, res: Response) {
  try {
    const { memberId } = req.body as { memberId: number };
    if (!memberId) {
      res.status(400).json({ error: '缺少 memberId' });
      return;
    }
    const result = checkinMember(memberId);
    res.json(result);
  } catch (err) {
    console.error('[doCheckin]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '核销失败' });
  }
}

export function listCheckinRecords(req: Request, res: Response) {
  try {
    const memberId = req.query.memberId ? Number(req.query.memberId) : undefined;
    const records = getCheckinRecords(memberId);
    res.json(records);
  } catch (err) {
    console.error('[listCheckinRecords]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '查询核销记录失败' });
  }
}

export function memberStats(_req: Request, res: Response) {
  try {
    const stats = getMemberStats();
    res.json(stats);
  } catch (err) {
    console.error('[memberStats]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '查询统计失败' });
  }
}
