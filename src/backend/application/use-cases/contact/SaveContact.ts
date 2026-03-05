import { IContactRepository } from "../../../domain/repositories/IContactRepository";
import { Contact } from "../../../domain/entities/Contact";

export class SaveContact {
  constructor(private contactRepository: IContactRepository) {}

  async execute(contact: Contact): Promise<Contact> {
    return this.contactRepository.save(contact);
  }
}
