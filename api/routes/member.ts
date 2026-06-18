import { Router } from 'express';
import {
  getPackages,
  registerMember,
  renewMemberController,
  listMembers,
  findMemberByPhone,
  doCheckin,
  listCheckinRecords,
  listTransactionRecords,
  memberStats,
} from '../controllers/memberController.js';

const router = Router();

router.get('/packages', getPackages);
router.get('/members/stats', memberStats);
router.get('/members', listMembers);
router.get('/members/phone/:phone', findMemberByPhone);
router.post('/members', registerMember);
router.post('/members/renew', renewMemberController);
router.post('/checkin', doCheckin);
router.get('/checkin-records', listCheckinRecords);
router.get('/transaction-records', listTransactionRecords);

export default router;
