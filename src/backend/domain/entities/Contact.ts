export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  notes?: string;
  isVoter?: boolean;
  politicalSpectrum?: "Left" | "Right" | "Center";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
