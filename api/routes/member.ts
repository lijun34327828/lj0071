import { Router } from 'express';
import {
  getPackages,
  registerMember,
  listMembers,
  findMemberByPhone,
  doCheckin,
  listCheckinRecords,
  memberStats,
} from '../controllers/memberController.js';

const router = Router();

router.get('/packages', getPackages);
router.get('/members/stats', memberStats);
router.get('/members', listMembers);
router.get('/members/phone/:phone', findMemberByPhone);
router.post('/members', registerMember);
router.post('/checkin', doCheckin);
router.get('/checkin-records', listCheckinRecords);

export default router;
