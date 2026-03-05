import { Router } from 'express';
import { demandRoutes } from './demandRoutes';
import { memberRoutes } from './memberRoutes';
import { contactRoutes } from './contactRoutes';
import { settingsRoutes } from './settingsRoutes';

const router = Router();

router.use('/demands', demandRoutes);
router.use('/members', memberRoutes);
router.use('/contacts', contactRoutes);
router.use('/settings', settingsRoutes);

export { router as apiRoutes };
