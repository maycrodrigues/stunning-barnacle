import mongoose, { Schema } from 'mongoose';
import { Demand } from '../../../domain/entities/Demand';
import { StatusHistorySchema, TimelineEventSchema, DemandTratativaSchema } from './shared';

const DemandSchema = new Schema<Demand>({
  id: { type: String, required: true, unique: true, index: true }, // Original ULID
  tenantId: { type: String, index: true, required: true }, // Added for multi-tenancy support
  
  // Form Data
  title: { type: String, required: true },
  category: { type: String, required: true },
  urgency: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number
  },
  requesterName: { type: String, required: true },
  requesterContact: { type: String, required: true },
  deadline: Date,
  responsibleId: String,

  // System Data
  protocol: { type: String, required: true, unique: true },
  active: { type: Boolean, required: true, default: true },
  status: { type: String, required: true },
  statusHistory: [StatusHistorySchema],
  totalDuration: { type: Number, default: 0 },
  timeline: [TimelineEventSchema],
  tratativas: [DemandTratativaSchema],
  
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true, // Mongoose handles createdAt/updatedAt automatically if enabled
  collection: 'demands'
});

export const DemandModel = mongoose.models.Demand || mongoose.model<Demand>('Demand', DemandSchema);
