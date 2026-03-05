import { Router } from 'express';
import { MongoMemberRepository } from '../../infrastructure/repositories/MongoMemberRepository';
import { GetAllMembers } from '../../application/use-cases/member/GetAllMembers';
import { SaveMember } from '../../application/use-cases/member/SaveMember';
import { MemberController } from '../controllers/MemberController';

const router = Router();

const memberRepository = new MongoMemberRepository();
const getAllMembers = new GetAllMembers(memberRepository);
const saveMember = new SaveMember(memberRepository);
const memberController = new MemberController(getAllMembers, saveMember);

router.get('/', memberController.getAll);
router.post('/', memberController.save);

export { router as memberRoutes };
