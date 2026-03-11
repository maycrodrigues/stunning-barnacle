import mongoose, { Schema } from 'mongoose';
import { Contact } from '../../../domain/entities/Contact';

const ContactSchema = new Schema<Contact>({
  id: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, index: true, required: true },

  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  neighborhood: String,
  notes: String,
  isVoter: Boolean,
  politicalSpectrum: { type: String, enum: ["Left", "Right", "Center"] },
  active: { type: Boolean, required: true, default: true },

  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true,
  collection: 'contacts'
});

export const ContactModel = mongoose.models.Contact || mongoose.model<Contact>('Contact', ContactSchema);
