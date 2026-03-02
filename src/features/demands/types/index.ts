import { z } from "zod";

export const demandSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  urgency: z.string().min(1, "Selecione a urgência"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable()
    .optional(),
  requesterName: z.string().min(3, "Nome do solicitante é obrigatório"),
  requesterContact: z.string().min(5, "Contato é obrigatório (email ou telefone)"),
  status: z.string().optional(),
  deadline: z.date().optional(),
  responsibleId: z.string().optional(),
});

export type DemandFormData = z.infer<typeof demandSchema>;
