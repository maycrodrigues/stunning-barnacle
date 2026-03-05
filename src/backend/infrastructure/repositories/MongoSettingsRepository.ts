import { ISettingsRepository } from "../../domain/repositories/ISettingsRepository";
import { Settings } from "../../domain/entities/Settings";
import { SettingsModel } from "../database/models/SettingsModel";

export class MongoSettingsRepository implements ISettingsRepository {
  async findAll(): Promise<Settings[]> {
    return SettingsModel.find({});
  }

  async findById(id: string): Promise<Settings | null> {
    return SettingsModel.findOne({ id });
  }

  async save(settings: Settings): Promise<Settings> {
    const result = await SettingsModel.findOneAndUpdate(
      { id: settings.id },
      { ...settings, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    
    if (!result) {
      throw new Error("Failed to save settings");
    }

    return result;
  }
}
