import mongoose from "mongoose";
import { ActivityLog } from "../models/activityLog";

interface LogChange {
  field: string;
  oldValue?: string;
  newValue?: string;
}

interface LogInput {
  projectId: string;
  userId: string;
  actorName: string;
  action: string;
  entityType: "ISSUE" | "PROJECT" | "SPRINT" | "COMMENT";
  issueId?: string;
  sprintId?: string;
  changes?: LogChange[];
}

export async function logActivity(input: LogInput): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await ActivityLog.create(input);
  } catch (err) {
    console.error("[activity] failed to log", err);
  }
}