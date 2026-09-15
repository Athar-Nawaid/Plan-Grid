import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(API_URL, {
    auth: { token: localStorage.getItem("pm_token") },
  });
  return socket;
}

export function joinProject(projectId: string): void {
  getSocket().emit("joinProject", projectId);
}

export function leaveProject(projectId: string): void {
  getSocket().emit("leaveProject", projectId);
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function reconnectSocket(): void {
  disconnectSocket();
  getSocket();
}