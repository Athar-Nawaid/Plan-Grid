import { Schema, model, models } from "mongoose";

export interface IActivityLog {
  projectId: string;
  issueId?: string;
  sprintId?: string;
  userId: string;
  actorName: string;
  action: string;
  entityType: "ISSUE" | "PROJECT" | "SPRINT" | "COMMENT";
  changes?: { field: string; oldValue?: string; newValue?: string }[];
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    projectId: { type: String, required: true, index: true },
    issueId: { type: String, index: true },
    sprintId: { type: String },
    userId: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true, enum: ["ISSUE", "PROJECT", "SPRINT", "COMMENT"] },
    changes: {
      type: [
        {
          field: String,
          oldValue: String,
          newValue: String,
        },
      ],
      default: undefined,
    },
  },
  { timestamps: { createdAt: "createdAt" } }
);

activityLogSchema.index({ projectId: 1, createdAt: -1 });

export const ActivityLog =
  models.ActivityLog || model<IActivityLog>("ActivityLog", activityLogSchema);