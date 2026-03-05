import { Router } from 'express';
import { MongoContactRepository } from '../../infrastructure/repositories/MongoContactRepository';
import { GetAllContacts } from '../../application/use-cases/contact/GetAllContacts';
import { SaveContact } from '../../application/use-cases/contact/SaveContact';
import { ContactController } from '../controllers/ContactController';

const router = Router();

const contactRepository = new MongoContactRepository();
const getAllContacts = new GetAllContacts(contactRepository);
const saveContact = new SaveContact(contactRepository);
const contactController = new ContactController(getAllContacts, saveContact);

router.get('/', contactController.getAll);
router.post('/', contactController.save);

export { router as contactRoutes };
