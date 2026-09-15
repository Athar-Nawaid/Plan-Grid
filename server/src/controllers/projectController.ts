import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/prisma";
import { logActivity } from "../services/activityService";

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  key: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z]+$/, "Key must be uppercase letters only, e.g. PROJ"),
  description: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const memberRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.userId! } } },
    include: { _count: { select: { members: true, issues: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(projects);
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      },
    },
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const keyExists = await prisma.project.findUnique({
    where: { key: parsed.data.key },
  });
  if (keyExists) {
    res.status(409).json({ error: "Project key already exists" });
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      key: parsed.data.key,
      description: parsed.data.description,
      ownerId: req.userId!,
      members: {
        create: { userId: req.userId!, role: "ADMIN" },
      },
    },
  });

  await logActivity({
    projectId: project.id,
    userId: req.userId!,
    actorName: req.userName!,
    action: "created",
    entityType: "PROJECT",
  });

  res.status(201).json(project);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  await logActivity({
    projectId: project.id,
    userId: req.userId!,
    actorName: req.userName!,
    action: "updated",
    entityType: "PROJECT",
  });

  res.json(project);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const parsed = memberRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const project = req.params.id;
  const { userId, role } = parsed.data;

  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project, userId } },
    create: { projectId: project, userId, role },
    update: { role },
  });

  res.status(201).json(member);
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  res.json(members);
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = req.params.userId;

  if (userId === req.userId) {
    res.status(400).json({ error: "You cannot remove yourself" });
    return;
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
  res.status(204).end();
});