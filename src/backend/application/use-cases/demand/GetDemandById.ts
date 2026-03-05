import { IDemandRepository } from "../../../domain/repositories/IDemandRepository";
import { Demand } from "../../../domain/entities/Demand";

export class GetDemandById {
  constructor(private demandRepository: IDemandRepository) {}

  async execute(id: string): Promise<Demand | null> {
    return this.demandRepository.findById(id);
  }
}
