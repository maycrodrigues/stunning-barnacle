import { Option, Tratativa } from "./types";

export interface Settings {
  id: string;
  tenantId: string;
  categories: Option[];
  urgencies: Option[];
  status: Option[];
  tratativas: Tratativa[];
  roles: Option[];
  createdAt: Date;
  updatedAt: Date;
}
