import { Request, Response } from 'express';
import { GetSettings } from '../../application/use-cases/settings/GetSettings';
import { SaveSettings } from '../../application/use-cases/settings/SaveSettings';
import { logger } from '../../shared/utils/logger';

export class SettingsController {
  constructor(
    private getSettings: GetSettings,
    private saveSettings: SaveSettings
  ) {}

  getAll = async (_req: Request, res: Response) => {
    try {
      const settings = await this.getSettings.execute();
      logger.settings('Fetched all settings', { count: settings.length });
      res.json(settings);
    } catch (error) {
      logger.error('Error fetching settings', { context: 'SETTINGS', error });
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  };

  save = async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      const result = await this.saveSettings.execute(settings);
      logger.settings('Settings synced', { id: settings.id });
      res.json(result);
    } catch (error) {
      logger.error('Error syncing settings', { context: 'SETTINGS', error, body: req.body });
      res.status(500).json({ error: 'Failed to sync settings' });
    }
  };
}
