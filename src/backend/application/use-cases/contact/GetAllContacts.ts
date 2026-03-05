import { IContactRepository } from "../../../domain/repositories/IContactRepository";
import { Contact } from "../../../domain/entities/Contact";

export class GetAllContacts {
  constructor(private contactRepository: IContactRepository) {}

  async execute(): Promise<Contact[]> {
    return this.contactRepository.findAll();
  }
}
