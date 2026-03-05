import { Router } from 'express';
import { MongoDemandRepository } from '../../infrastructure/repositories/MongoDemandRepository';
import { GetAllDemands } from '../../application/use-cases/demand/GetAllDemands';
import { GetDemandById } from '../../application/use-cases/demand/GetDemandById';
import { SaveDemand } from '../../application/use-cases/demand/SaveDemand';
import { DemandController } from '../controllers/DemandController';

const router = Router();

const demandRepository = new MongoDemandRepository();
const getAllDemands = new GetAllDemands(demandRepository);
const getDemandById = new GetDemandById(demandRepository);
const saveDemand = new SaveDemand(demandRepository);
const demandController = new DemandController(getAllDemands, getDemandById, saveDemand);

router.get('/', demandController.getAll);
router.get('/:id', demandController.getById);
router.post('/', demandController.save);

export { router as demandRoutes };
