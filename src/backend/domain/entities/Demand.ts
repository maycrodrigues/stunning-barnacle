import { DemandTratativa, StatusHistoryEntry, TimelineEvent } from "./types";

export interface Demand {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  urgency: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
  };
  requesterName: string;
  requesterContact: string;
  deadline?: Date;
  responsibleId?: string;
  protocol: string;
  active: boolean;
  status: string;
  statusHistory: StatusHistoryEntry[];
  totalDuration: number;
  timeline: TimelineEvent[];
  tratativas: DemandTratativa[];
  createdAt: Date;
  updatedAt: Date;
}
