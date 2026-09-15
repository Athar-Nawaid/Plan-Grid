export type IssueType = "BUG" | "FEATURE" | "TASK" | "STORY";
export type IssueStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Role = "ADMIN" | "MEMBER" | "VIEWER";
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; issues: number };
  owner?: User;
  members?: ProjectMember[];
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user?: User;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: SprintStatus;
  issues?: { id: string; status: IssueStatus; storyPoints: number | null }[];
  _count?: { issues: number };
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  assigneeId?: string | null;
  reporterId?: string | null;
  sprintId?: string | null;
  storyPoints?: number | null;
  dueDate?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  reporter?: User | null;
  sprint?: { id: string; name: string } | null;
  comments?: Comment[];
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

export interface ActivityLog {
  _id: string;
  projectId: string;
  issueId?: string;
  sprintId?: string;
  userId: string;
  actorName: string;
  action: string;
  entityType: "ISSUE" | "PROJECT" | "SPRINT" | "COMMENT";
  changes?: { field: string; oldValue?: string; newValue?: string }[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}