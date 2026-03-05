import { IDemandRepository } from "../../../domain/repositories/IDemandRepository";
import { Demand } from "../../../domain/entities/Demand";

export class GetAllDemands {
  constructor(private demandRepository: IDemandRepository) {}

  async execute(): Promise<Demand[]> {
    return this.demandRepository.findAll();
  }
}
