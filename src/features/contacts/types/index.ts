import { Contact } from "../../../shared/services/db";

export type { Contact };

export interface ContactFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}
