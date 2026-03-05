import { IDemandRepository } from "../../../domain/repositories/IDemandRepository";
import { Demand } from "../../../domain/entities/Demand";

export class SaveDemand {
  constructor(private demandRepository: IDemandRepository) {}

  async execute(demand: Demand): Promise<Demand> {
    return this.demandRepository.save(demand);
  }
}
