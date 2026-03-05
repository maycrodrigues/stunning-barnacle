import { Demand } from "../entities/Demand";

export interface IDemandRepository {
  findAll(): Promise<Demand[]>;
  findById(id: string): Promise<Demand | null>;
  save(demand: Demand): Promise<Demand>;
}
