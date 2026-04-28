export interface Task {
  id: number;
  name: string;
  color: string;
  status: 'active' | 'archived';
  created_at: number;
}

export interface ActiveEntry {
  entryId: number;
  taskId: number;
  startedAt: number;
}

export interface StatTotal {
  id: number;
  name: string;
  color: string;
  status: string;
  total_seconds: number;
}

export interface StatDaily {
  taskId: number;
  name: string;
  color: string;
  day: string;
  seconds: number;
}

export interface StatsResponse {
  totals: StatTotal[];
  daily: StatDaily[];
}
