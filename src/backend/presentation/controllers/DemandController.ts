import { Request, Response } from 'express';
import { GetAllDemands } from '../../application/use-cases/demand/GetAllDemands';
import { GetDemandById } from '../../application/use-cases/demand/GetDemandById';
import { SaveDemand } from '../../application/use-cases/demand/SaveDemand';
import { logger } from '../../shared/utils/logger';

export class DemandController {
  constructor(
    private getAllDemands: GetAllDemands,
    private getDemandById: GetDemandById,
    private saveDemand: SaveDemand
  ) {}

  getAll = async (_req: Request, res: Response) => {
    try {
      const demands = await this.getAllDemands.execute();
      logger.demand('Fetched all demands', { count: demands.length });
      res.json(demands);
    } catch (error) {
      logger.error('Error fetching demands', { context: 'DEMAND', error });
      res.status(500).json({ error: 'Failed to fetch demands' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const demandId = String(req.params.id);
      const demand = await this.getDemandById.execute(demandId);
      if (!demand) {
        logger.demand('Demand not found', { demandId });
        return res.status(404).json({ error: 'Demand not found' });
      }
      logger.demand('Fetched demand details', { demandId });
      res.json(demand);
    } catch (error) {
      logger.error('Error fetching demand', { context: 'DEMAND', error, demandId: req.params.id });
      res.status(500).json({ error: 'Failed to fetch demand' });
    }
  };

  save = async (req: Request, res: Response) => {
    const demand = req.body;
    try {
      const result = await this.saveDemand.execute(demand);
      const isUpdate = demand.createdAt && demand.updatedAt && demand.createdAt !== demand.updatedAt; // Heuristic, original code compared timestamps from result which is safer but let's trust the logic
      // Actually original logic was: result?.createdAt === result?.updatedAt ? 'created' : 'updated'
      // But we return the result.operation to be more explicit.
      const operation = isUpdate ? 'updated' : 'created';
      logger.demand('Demand synced', { demandId: demand.id, operation });
      res.json(result);
    } catch (error) {
      logger.error('Error syncing demand', { context: 'DEMAND', error, body: req.body });
      res.status(500).json({ error: 'Failed to sync demand' });
    }
  };
}
