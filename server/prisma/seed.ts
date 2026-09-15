import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash,
    },
  });

  const dev = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      email: "dev@example.com",
      name: "Dev User",
      passwordHash,
    },
  });

  const project = await prisma.project.upsert({
    where: { key: "SCRUM" },
    update: {},
    create: {
      name: "Scrum Board",
      key: "SCRUM",
      description: "Sample project for the demo",
      ownerId: demo.id,
      members: {
        create: [
          { userId: demo.id, role: "ADMIN" },
          { userId: dev.id, role: "MEMBER" },
        ],
      },
    },
  });

  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 1",
      goal: "Initial backlog",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const issues = [
    {
      title: "Set up project board",
      description: "Create the initial kanban columns",
      type: "TASK" as const,
      status: "DONE" as const,
      priority: "HIGH" as const,
      storyPoints: 3,
      assigneeId: demo.id,
    },
    {
      title: "Add drag and drop",
      description: "Move issues between columns",
      type: "FEATURE" as const,
      status: "IN_PROGRESS" as const,
      priority: "MEDIUM" as const,
      storyPoints: 5,
      assigneeId: dev.id,
    },
    {
      title: "Fix login flash",
      description: "Session flickers on refresh",
      type: "BUG" as const,
      status: "TODO" as const,
      priority: "CRITICAL" as const,
      storyPoints: 2,
      assigneeId: demo.id,
    },
    {
      title: "Design sprint report",
      description: "Burndown chart widget",
      type: "STORY" as const,
      status: "IN_REVIEW" as const,
      priority: "LOW" as const,
      storyPoints: 8,
      assigneeId: dev.id,
    },
  ];

  for (const issue of issues) {
    await prisma.issue.create({
      data: {
        ...issue,
        projectId: project.id,
        sprintId: sprint.id,
        reporterId: demo.id,
      },
    });
  }

  console.log("Seed complete");
  console.log("  Login: demo@example.com / demo1234");
  console.log(`  Project: ${project.key}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });