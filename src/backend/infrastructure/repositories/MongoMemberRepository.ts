import { IMemberRepository } from "../../domain/repositories/IMemberRepository";
import { Member } from "../../domain/entities/Member";
import { MemberModel } from "../database/models/MemberModel";

export class MongoMemberRepository implements IMemberRepository {
  async findAll(): Promise<Member[]> {
    return MemberModel.find({});
  }

  async findById(id: string): Promise<Member | null> {
    return MemberModel.findOne({ id });
  }

  async save(member: Member): Promise<Member> {
    const result = await MemberModel.findOneAndUpdate(
      { id: member.id },
      { ...member, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    
    if (!result) {
      throw new Error("Failed to save member");
    }

    return result;
  }
}
