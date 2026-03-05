import { Settings } from "../entities/Settings";

export interface ISettingsRepository {
  findAll(): Promise<Settings[]>;
  findById(id: string): Promise<Settings | null>;
  save(settings: Settings): Promise<Settings>;
}
