import mongoose, { Schema } from 'mongoose';
import { Settings } from '../../../domain/entities/Settings';
import { OptionSchema, TratativaConfigSchema } from './shared';

const SettingsSchema = new Schema<Settings>({
  id: { type: String, required: true, unique: true }, // "global_settings"
  tenantId: { type: String, index: true, required: true },

  categories: [OptionSchema],
  urgencies: [OptionSchema],
  status: [OptionSchema],
  tratativas: [TratativaConfigSchema],
  roles: [OptionSchema]
}, {
  timestamps: true,
  collection: 'settings'
});

export const SettingsModel = mongoose.models.Settings || mongoose.model<Settings>('Settings', SettingsSchema);
