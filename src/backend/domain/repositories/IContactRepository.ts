import { Contact } from "../entities/Contact";

export interface IContactRepository {
  findAll(): Promise<Contact[]>;
  findById(id: string): Promise<Contact | null>;
  save(contact: Contact): Promise<Contact>;
}
