import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/prisma";
import { logActivity } from "../services/activityService";
import { emitProjectChange, emitNewComment } from "../services/realtimeService";

const createIssueSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(["BUG", "FEATURE", "TASK", "STORY"]).default("TASK"),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  assigneeId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  storyPoints: z.number().int().min(0).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateIssueSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  type: z.enum(["BUG", "FEATURE", "TASK", "STORY"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  storyPoints: z.number().int().min(0).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const statusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  position: z.number().int().min(0).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const listIssues = asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const { status, priority, type, assigneeId, sprintId, search } = req.query;

  const where: Record<string, unknown> = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (type) where.type = type;
  if (assigneeId) where.assigneeId = assigneeId;
  if (sprintId) where.sprintId = sprintId;
  if (search) {
    where.OR = [{ title: { contains: String(search), mode: "insensitive" } }];
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      reporter: { select: { id: true, name: true, email: true, avatar: true } },
      sprint: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });
  res.json(issues);
});

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createIssueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const projectId = req.params.projectId;
  const data = parsed.data;

  const maxPosition = await prisma.issue.aggregate({
    where: { projectId, status: data.status ?? "TODO" },
    _max: { position: true },
  });

  const issue = await prisma.issue.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      reporterId: req.userId!,
      position: (maxPosition._max.position ?? 0) + 1,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      reporter: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  await logActivity({
    projectId,
    issueId: issue.id,
    userId: req.userId!,
    actorName: req.userName!,
    action: "created",
    entityType: "ISSUE",
  });

  res.status(201).json(issue);
  emitProjectChange(projectId);
});

export const getIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await prisma.issue.findUnique({
    where: { id: req.params.id },
    include: {
      project: { select: { id: true, name: true, key: true } },
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      reporter: { select: { id: true, name: true, email: true, avatar: true } },
      sprint: { select: { id: true, name: true } },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }
  res.json(issue);
});

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateIssueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const issueId = req.params.id;
  const existing = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!existing) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  const data = parsed.data as Record<string, unknown>;
  if ("dueDate" in data) data.dueDate = data.dueDate ? new Date(data.dueDate as string) : null;

  const changes: { field: string; oldValue: string; newValue: string }[] = [];
  for (const [key, value] of Object.entries(data)) {
    const oldValue = existing[key as keyof typeof existing];
    if (String(oldValue ?? "") !== String(value ?? "")) {
      changes.push({
        field: key,
        oldValue: String(oldValue ?? ""),
        newValue: String(value ?? ""),
      });
    }
  }

  const issue = await prisma.issue.update({
    where: { id: issueId },
    data: data as never,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      reporter: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  if (changes.length > 0) {
    await logActivity({
      projectId: existing.projectId,
      issueId,
      userId: req.userId!,
      actorName: req.userName!,
      action: "updated",
      entityType: "ISSUE",
      changes,
    });
  }

  res.json(issue);
});

export const updateIssueStatus = asyncHandler(async (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const issueId = req.params.id;
  const existing = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!existing) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  const swap = await prisma.issue.findFirst({
    where: {
      projectId: existing.projectId,
      status: parsed.data.status,
      position: parsed.data.position ?? existing.position,
    },
    orderBy: { position: "asc" },
  });

  const issue = await prisma.$transaction(async (tx) => {
    if (swap && swap.id !== issueId) {
      await tx.issue.update({
        where: { id: swap.id },
        data: { position: existing.position },
      });
    }
    return tx.issue.update({
      where: { id: issueId },
      data: {
        status: parsed.data.status,
        position: parsed.data.position ?? existing.position,
      },
    });
  });

  if (existing.status !== parsed.data.status) {
    await logActivity({
      projectId: existing.projectId,
      issueId,
      userId: req.userId!,
      actorName: req.userName!,
      action: "updated",
      entityType: "ISSUE",
      changes: [
        { field: "status", oldValue: existing.status, newValue: parsed.data.status },
      ],
    });
  }

  res.json(issue);
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }
  await prisma.issue.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const comments = await prisma.comment.findMany({
    where: { issueId: req.params.id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(comments);
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const issueId = req.params.id;
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  const comment = await prisma.comment.create({
    data: { issueId, userId: req.userId!, content: parsed.data.content },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  await logActivity({
    projectId: issue.projectId,
    issueId,
    userId: req.userId!,
    actorName: req.userName!,
    action: "commented",
    entityType: "COMMENT",
  });

  emitNewComment(issue.projectId, issueId, comment);

  res.status(201).json(comment);
});