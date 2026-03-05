import { ISettingsRepository } from "../../../domain/repositories/ISettingsRepository";
import { Settings } from "../../../domain/entities/Settings";

export class GetSettings {
  constructor(private settingsRepository: ISettingsRepository) {}

  async execute(): Promise<Settings[]> {
    return this.settingsRepository.findAll();
  }
}
