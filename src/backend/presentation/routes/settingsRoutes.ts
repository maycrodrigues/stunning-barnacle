import { Router } from 'express';
import { MongoSettingsRepository } from '../../infrastructure/repositories/MongoSettingsRepository';
import { GetSettings } from '../../application/use-cases/settings/GetSettings';
import { SaveSettings } from '../../application/use-cases/settings/SaveSettings';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();

const settingsRepository = new MongoSettingsRepository();
const getSettings = new GetSettings(settingsRepository);
const saveSettings = new SaveSettings(settingsRepository);
const settingsController = new SettingsController(getSettings, saveSettings);

router.get('/', settingsController.getAll);
router.post('/', settingsController.save);

export { router as settingsRoutes };
