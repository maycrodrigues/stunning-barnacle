import { Request, Response } from 'express';
import { GetAllMembers } from '../../application/use-cases/member/GetAllMembers';
import { SaveMember } from '../../application/use-cases/member/SaveMember';
import { logger } from '../../shared/utils/logger';

export class MemberController {
  constructor(
    private getAllMembers: GetAllMembers,
    private saveMember: SaveMember
  ) {}

  getAll = async (_req: Request, res: Response) => {
    try {
      const members = await this.getAllMembers.execute();
      logger.member('Fetched all members', { count: members.length });
      res.json(members);
    } catch (error) {
      logger.error('Error fetching members', { context: 'MEMBERS', error });
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  };

  save = async (req: Request, res: Response) => {
    try {
      const member = req.body;
      logger.member('Syncing member', { id: member.id, active: member.active });
      const result = await this.saveMember.execute(member);
      logger.member('Member synced', { id: member.id });
      res.json(result);
    } catch (error) {
      logger.error('Error syncing member', { context: 'MEMBERS', error, body: req.body });
      res.status(500).json({ error: 'Failed to sync member' });
    }
  };
}
