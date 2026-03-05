export interface Option {
  value: string;
  label: string;
  badge?: {
    text?: string;
    color?: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";
  };
}

export interface StatusHistoryEntry {
  status: string;
  startDate: Date;
  endDate?: Date;
  duration?: number;
  responsibleId?: string;
}

export type TimelineEventType = 'created' | 'updated' | 'status_change' | 'comment' | 'attachment' | 'tratativa';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  description?: string;
  metadata?: {
    from?: any;
    to?: any;
    field?: string;
    [key: string]: any;
  };
  user?: string;
}

export interface Tratativa {
  id: string;
  title: string;
  type: 'text' | 'number' | 'long_text';
  slug: string;
}

export interface DemandTratativa {
  id: string;
  tratativaId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}
