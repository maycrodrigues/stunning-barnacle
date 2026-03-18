import { Contact } from "../../../shared/services/db";
import { z } from "zod";

export type { Contact };

export const contactSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  notes: z.string().optional(),
  isVoter: z.boolean().optional(),
  politicalSpectrum: z.string().optional().or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactSchema>;
