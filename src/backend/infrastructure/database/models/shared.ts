import { Schema } from 'mongoose';

export const OptionSchema = new Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
  badge: {
    text: String,
    color: {
      type: String,
      enum: ["primary", "success", "error", "warning", "info", "light", "dark"]
    }
  }
}, { _id: false });

export const TratativaConfigSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'long_text'], required: true },
  slug: { type: String, required: true }
}, { _id: false });

export const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  duration: Number,
  responsibleId: String
}, { _id: false });

export const TimelineEventSchema = new Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['created', 'updated', 'status_change', 'comment', 'attachment', 'tratativa'],
    required: true 
  },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  description: String,
  metadata: { type: Schema.Types.Mixed }, // Flexible metadata
  user: String
}, { _id: false });

export const DemandTratativaSchema = new Schema({
  id: { type: String, required: true },
  tratativaId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
  createdAt: { type: String, required: true }, // Stored as string in interface? Check consistency. usually Date but interface says string.
  completedAt: String
}, { _id: false });
