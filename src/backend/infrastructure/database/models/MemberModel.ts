import mongoose, { Schema } from 'mongoose';
import { Member } from '../../../domain/entities/Member';

const MemberSchema = new Schema<Member>({
  id: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, index: true, required: true },

  name: { type: String, required: true },
  email: { type: String }, // Optional in interface
  phone: { type: String, required: true },
  address: String,
  photo: String,
  roleId: String,
  social: {
    instagram: String,
    facebook: String,
    linkedin: String,
    x: String
  },
  
  active: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true,
  collection: 'members'
});

export const MemberModel = mongoose.models.Member || mongoose.model<Member>('Member', MemberSchema);
