import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/prisma";
import { logActivity } from "../services/activityService";

const sprintSchema = z.object({
  name: z.string().min(1).max(255),
  goal: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

const addIssuesSchema = z.object({
  issueIds: z.array(z.string()).min(1),
});

export const listSprints = asyncHandler(async (req: Request, res: Response) => {
  const sprints = await prisma.sprint.findMany({
    where: { projectId: req.params.projectId },
    include: {
      issues: {
        select: { id: true, status: true, storyPoints: true },
      },
      _count: { select: { issues: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(sprints);
});

export const createSprint = asyncHandler(async (req: Request, res: Response) => {
  const parsed = sprintSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const sprint = await prisma.sprint.create({
    data: {
      projectId: req.params.projectId,
      name: parsed.data.name,
      goal: parsed.data.goal,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  await logActivity({
    projectId: sprint.projectId,
    sprintId: sprint.id,
    userId: req.userId!,
    actorName: req.userName!,
    action: "created",
    entityType: "SPRINT",
  });

  res.status(201).json(sprint);
});

export const updateSprint = asyncHandler(async (req: Request, res: Response) => {
  const parsed = sprintSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const data = parsed.data as Record<string, unknown>;
  if ("startDate" in data) data.startDate = data.startDate ? new Date(data.startDate as string) : null;
  if ("endDate" in data) data.endDate = data.endDate ? new Date(data.endDate as string) : null;

  const sprint = await prisma.sprint.update({
    where: { id: req.params.id },
    data: data as never,
  });
  res.json(sprint);
});

export const startSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await prisma.sprint.update({
    where: { id: req.params.id },
    data: {
      status: "ACTIVE",
      startDate: new Date(),
    },
  });

  await logActivity({
    projectId: sprint.projectId,
    sprintId: sprint.id,
    userId: req.userId!,
    actorName: req.userName!,
    action: "started",
    entityType: "SPRINT",
  });

  res.json(sprint);
});

export const completeSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await prisma.sprint.update({
    where: { id: req.params.id },
    data: {
      status: "COMPLETED",
      endDate: new Date(),
    },
  });

  await logActivity({
    projectId: sprint.projectId,
    sprintId: sprint.id,
    userId: req.userId!,
    actorName: req.userName!,
    action: "completed",
    entityType: "SPRINT",
  });

  res.json(sprint);
});

export const addIssuesToSprint = asyncHandler(async (req: Request, res: Response) => {
  const parsed = addIssuesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  await prisma.issue.updateMany({
    where: { id: { in: parsed.data.issueIds } },
    data: { sprintId: req.params.id },
  });

  const sprint = await prisma.sprint.findUnique({
    where: { id: req.params.id },
    include: { issues: { select: { id: true } } },
  });

  res.json(sprint);
});

export const removeIssueFromSprint = asyncHandler(async (req: Request, res: Response) => {
  await prisma.issue.update({
    where: { id: req.params.issueId },
    data: { sprintId: null },
  });
  res.status(204).end();
});

export const deleteSprint = asyncHandler(async (req: Request, res: Response) => {
  await prisma.sprint.delete({ where: { id: req.params.id } });
  res.status(204).end();
});