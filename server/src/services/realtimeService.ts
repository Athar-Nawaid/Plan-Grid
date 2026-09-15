import type { Server } from "socket.io";

let ioRef: Server | null = null;

export function initRealtime(io: Server): void {
  ioRef = io;
}

function room(projectId: string): string {
  return `project:${projectId}`;
}

function emit(projectId: string, event: string, payload: unknown): void {
  ioRef?.to(room(projectId)).emit(event, payload);
}

export function emitProjectChange(projectId: string): void {
  emit(projectId, "project:changed", { projectId });
}

export function emitNewComment(
  projectId: string,
  issueId: string,
  comment: unknown
): void {
  emit(projectId, "comment:created", { projectId, issueId, comment });
}