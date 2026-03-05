import { Request, Response } from 'express';
import { GetAllContacts } from '../../application/use-cases/contact/GetAllContacts';
import { SaveContact } from '../../application/use-cases/contact/SaveContact';
import { logger } from '../../shared/utils/logger';

export class ContactController {
  constructor(
    private getAllContacts: GetAllContacts,
    private saveContact: SaveContact
  ) {}

  getAll = async (_req: Request, res: Response) => {
    try {
      const contacts = await this.getAllContacts.execute();
      logger.contact('Fetched all contacts', { count: contacts.length });
      res.json(contacts);
    } catch (error) {
      logger.error('Error fetching contacts', { context: 'CONTACT', error });
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  };

  save = async (req: Request, res: Response) => {
    try {
      const contact = req.body;
      const result = await this.saveContact.execute(contact);
      logger.contact('Contact synced', { id: contact.id });
      res.json(result);
    } catch (error) {
      logger.error('Error syncing contact', { context: 'CONTACT', error, body: req.body });
      res.status(500).json({ error: 'Failed to sync contact' });
    }
  };
}
