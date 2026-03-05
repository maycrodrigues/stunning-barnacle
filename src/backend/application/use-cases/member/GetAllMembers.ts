import { IMemberRepository } from "../../../domain/repositories/IMemberRepository";
import { Member } from "../../../domain/entities/Member";

export class GetAllMembers {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(): Promise<Member[]> {
    return this.memberRepository.findAll();
  }
}
