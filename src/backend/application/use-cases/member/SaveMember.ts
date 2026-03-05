import { IMemberRepository } from "../../../domain/repositories/IMemberRepository";
import { Member } from "../../../domain/entities/Member";

export class SaveMember {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(member: Member): Promise<Member> {
    return this.memberRepository.save(member);
  }
}
