import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds a demo workspace mirroring the Figma sample data, so a fresh clone
 * shows a populated list immediately. Guest logins still start empty.
 */
const DEMO_EMAIL = 'demo@ablespace.test';

const DEFAULT_LABELS = [
  { name: 'Research', color: 'blue' },
  { name: 'Design', color: 'violet' },
  { name: 'Development', color: 'emerald' },
  { name: 'Testing', color: 'amber' },
  { name: 'Deployment', color: 'rose' },
];

/** The design's rows repeat across every group. */
const SAMPLE_ROWS = [
  { title: 'Design Homepage', priority: 'high', dueDate: '2026-09-12' },
  { title: 'Develop Login Feature', priority: 'low', dueDate: '2026-09-15' },
  { title: 'Test Payment Gateway', priority: 'medium', dueDate: '2026-09-18' },
];

async function main(): Promise<void> {
  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: 'Dexter',
      email: DEMO_EMAIL,
      title: 'Designer',
      username: 'Dexuser',
      isGuest: false,
    },
  });

  // Idempotent: wipe the demo workspace before reseeding.
  await prisma.task.deleteMany({ where: { ownerId: demo.id } });
  await prisma.project.deleteMany({ where: { ownerId: demo.id } });
  await prisma.label.deleteMany({ where: { ownerId: demo.id } });

  await prisma.label.createMany({
    data: DEFAULT_LABELS.map((label, position) => ({ ...label, position, ownerId: demo.id })),
  });
  const labels = await prisma.label.findMany({
    where: { ownerId: demo.id },
    orderBy: { position: 'asc' },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Design Homepage',
      priority: 'high',
      dueDate: new Date('2026-09-12'),
      leadId: demo.id,
      ownerId: demo.id,
      position: 0,
    },
  });

  await prisma.project.createMany({
    data: [
      {
        name: 'Develop Login Feature',
        priority: 'low',
        dueDate: new Date('2026-09-15'),
        leadId: demo.id,
        ownerId: demo.id,
        position: 1,
      },
      {
        name: 'Test Payment Gateway',
        priority: 'medium',
        dueDate: new Date('2026-09-18'),
        ownerId: demo.id,
        position: 2,
      },
    ],
  });

  for (const status of ['todo', 'doing', 'completed'] as const) {
    for (const [index, row] of SAMPLE_ROWS.entries()) {
      await prisma.task.create({
        data: {
          title: row.title,
          status,
          priority: row.priority,
          dueDate: new Date(row.dueDate),
          completedAt: status === 'completed' ? new Date() : null,
          position: index,
          ownerId: demo.id,
          assigneeId: demo.id,
          projectId: project.id,
        },
      });
    }
  }

  // A richer task backing the detail-page frame.
  const detailed = await prisma.task.create({
    data: {
      title: 'Write API Documentation',
      description:
        'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.',
      status: 'backlog',
      priority: 'high',
      dueDate: new Date('2026-07-31'),
      startDate: new Date('2026-01-10'),
      position: 0,
      ownerId: demo.id,
      assigneeId: demo.id,
      projectId: project.id,
      labels: { connect: labels.map((label) => ({ id: label.id })) },
    },
  });

  for (const [index, row] of SAMPLE_ROWS.entries()) {
    await prisma.task.create({
      data: {
        title: `Subtask ${index + 1}`,
        status: 'todo',
        priority: row.priority,
        dueDate: new Date(row.dueDate),
        position: index,
        ownerId: demo.id,
        assigneeId: demo.id,
        parentId: detailed.id,
      },
    });
  }

  await prisma.comment.create({
    data: { body: 'dsds', taskId: detailed.id, authorId: demo.id },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: 'priority_changed',
        message: 'changed priority from No priority to Urgent',
        taskId: detailed.id,
        actorId: demo.id,
      },
      {
        type: 'update_posted',
        message: 'posted an update',
        taskId: detailed.id,
        actorId: demo.id,
      },
    ],
  });

  console.log(`Seeded demo workspace for ${DEMO_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
