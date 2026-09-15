import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ActivityLog } from "../models/activityLog";
import mongoose from "mongoose";

export const getProjectActivity = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    res.json([]);
    return;
  }

  const limit = Math.min(parseInt(String(req.query.limit || "50"), 10), 200);
  const logs = await ActivityLog.find({ projectId: req.params.projectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(logs);
});

export const getIssueActivity = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    res.json([]);
    return;
  }

  const logs = await ActivityLog.find({ issueId: req.params.issueId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json(logs);
});