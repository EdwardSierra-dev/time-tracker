export type Role = "LEAD" | "ANALYST";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  country: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  date: string;
  hours: number;
  client: string;
  environment: string;
  task: string;
  description: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name">;
  projects?: Pick<Project, "name">;
}

export interface HourLimit {
  id: string;
  country: string;
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
}

export interface TimeEntryFilters {
  dateFrom?: string;
  dateTo?: string;
  client?: string;
  environment?: string;
  analystId?: string;
  projectId?: string;
}

export type AuditActionType =
  | "CREATE_ANALYST"
  | "UPDATE_LIMITS"
  | "CHANGE_PASSWORD";

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  action_type: AuditActionType;
  description: string;
  metadata: Record<string, unknown>;
}
