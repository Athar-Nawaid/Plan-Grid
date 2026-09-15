import { api, clearToken, getToken, setToken } from "./api";
import type {
  ActivityLog,
  AuthResponse,
  Comment,
  Issue,
  IssueStatus,
  Project,
  ProjectMember,
  Role,
  Sprint,
  User,
} from "../types";

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),
};

export const projectApi = {
  list: () => api.get<Project[]>("/projects").then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: { name: string; key: string; description?: string }) =>
    api.post<Project>("/projects", data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; key: string; description: string }>) =>
    api.put<Project>(`/projects/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
  addMember: (id: string, data: { userId: string; role: Role }) =>
    api.post<ProjectMember>(`/projects/${id}/members`, data).then((r) => r.data),
  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`).then((r) => r.data),
  members: (id: string) =>
    api
      .get<ProjectMember[]>(`/projects/${id}/members`)
      .then((r) => r.data),
};

export const userApi = {
  search: (q: string) => api.get<User[]>("/users/search", { params: { q } }).then((r) => r.data),
};

export const issueApi = {
  list: (projectId: string, filters?: Record<string, string | number | undefined>) =>
    api
      .get<Issue[]>(`/projects/${projectId}/issues`, { params: filters })
      .then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<Issue>(`/projects/${projectId}/issues/${id}`).then((r) => r.data),
  create: (
    projectId: string,
    data: Partial<
      Pick<Issue, "title" | "description" | "type" | "priority" | "assigneeId" | "sprintId" | "storyPoints">
    >
  ) => api.post<Issue>(`/projects/${projectId}/issues`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: Partial<Omit<Issue, "id">>) =>
    api.put<Issue>(`/projects/${projectId}/issues/${id}`, data).then((r) => r.data),
  updateStatus: (projectId: string, id: string, status: IssueStatus, position: number) =>
    api.put<Issue>(`/projects/${projectId}/issues/${id}/status`, { status, position }).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/issues/${id}`).then((r) => r.data),
  comments: (projectId: string, id: string) =>
    api.get<Comment[]>(`/projects/${projectId}/issues/${id}/comments`).then((r) => r.data),
  addComment: (projectId: string, id: string, content: string) =>
    api.post<Comment>(`/projects/${projectId}/issues/${id}/comments`, { content }).then((r) => r.data),
};

export const sprintApi = {
  list: (projectId: string) =>
    api.get<Sprint[]>(`/projects/${projectId}/sprints`).then((r) => r.data),
  create: (
    projectId: string,
    data: { name: string; goal?: string; startDate?: string | null; endDate?: string | null }
  ) => api.post<Sprint>(`/projects/${projectId}/sprints`, data).then((r) => r.data),
  start: (projectId: string, id: string) =>
    api.post<Sprint>(`/projects/${projectId}/sprints/${id}/start`).then((r) => r.data),
  complete: (projectId: string, id: string) =>
    api.post<Sprint>(`/projects/${projectId}/sprints/${id}/complete`).then((r) => r.data),
  addIssues: (projectId: string, id: string, issueIds: string[]) =>
    api.post<Sprint>(`/projects/${projectId}/sprints/${id}/issues`, { issueIds }).then((r) => r.data),
  remove: (projectId: string, id: string, issueId: string) =>
    api.delete(`/projects/${projectId}/sprints/${id}/issues/${issueId}`).then((r) => r.data),
};

export const activityApi = {
  project: (projectId: string, limit = 30) =>
    api
      .get<ActivityLog[]>(`/activity/projects/${projectId}/activity`, { params: { limit } })
      .then((r) => r.data),
  issue: (issueId: string) =>
    api.get<ActivityLog[]>(`/activity/issues/${issueId}/activity`).then((r) => r.data),
};

export { clearToken, getToken, setToken };
export type { AuthResponse, User };