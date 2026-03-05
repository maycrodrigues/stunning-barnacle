import { IDemandRepository } from "../../domain/repositories/IDemandRepository";
import { Demand } from "../../domain/entities/Demand";
import { DemandModel } from "../database/models/DemandModel";

export class MongoDemandRepository implements IDemandRepository {
  async findAll(): Promise<Demand[]> {
    return DemandModel.find({});
  }

  async findById(id: string): Promise<Demand | null> {
    return DemandModel.findOne({ id });
  }

  async save(demand: Demand): Promise<Demand> {
    const result = await DemandModel.findOneAndUpdate(
      { id: demand.id },
      { ...demand, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    
    if (!result) {
      throw new Error("Failed to save demand");
    }

    return result;
  }
}
