import { PrismaClient } from '@prisma/client';
import { DEFAULT_LABELS } from '../labels/labels.service';

/** The rows the design repeats across every status group. */
const SAMPLE_ROWS = [
  { title: 'Design Homepage', priority: 'high', dueDate: '2026-09-12' },
  { title: 'Develop Login Feature', priority: 'low', dueDate: '2026-09-15' },
  { title: 'Test Payment Gateway', priority: 'medium', dueDate: '2026-09-18' },
];

/**
 * Populates a brand-new workspace with the sample data drawn in the Figma
 * frames: the label set, three projects, the three status groups, and the
 * richer task backing the detail page.
 *
 * Guest logins get this too. A reviewer opening the deployed app should land on
 * the design as drawn rather than an empty state — and since every guest is
 * given a private copy scoped to their own `ownerId`, the per-user isolation
 * the e2e suite pins is unaffected.
 *
 * A guest waits on this before their first paint, so it runs as three batched
 * transactions rather than a query per row — one per dependency step, since
 * each step needs ids minted by the one before it. Batching also makes each
 * step atomic: a failure part-way can no longer leave a half-built workspace.
 */
export async function seedWorkspace(prisma: PrismaClient, ownerId: string): Promise<void> {
  const now = new Date();

  const [createdLabels, project] = await prisma.$transaction([
    prisma.label.createManyAndReturn({
      data: DEFAULT_LABELS.map((label, position) => ({ ...label, position, ownerId })),
    }),
    prisma.project.create({
      data: {
        name: 'Design Homepage',
        priority: 'high',
        dueDate: new Date('2026-09-12'),
        leadId: ownerId,
        ownerId,
        position: 0,
      },
    }),
    prisma.project.createMany({
      data: [
        {
          name: 'Develop Login Feature',
          priority: 'low',
          dueDate: new Date('2026-09-15'),
          leadId: ownerId,
          ownerId,
          position: 1,
        },
        {
          name: 'Test Payment Gateway',
          priority: 'medium',
          dueDate: new Date('2026-09-18'),
          ownerId,
          position: 2,
        },
      ],
    }),
  ]);

  // `createManyAndReturn` does not document an ordering guarantee, and the chip
  // order is drawn, so sort rather than trust insertion order.
  const labels = [...createdLabels].sort((a, b) => a.position - b.position);

  const [, detailed] = await prisma.$transaction([
    prisma.task.createMany({
      data: (['todo', 'doing', 'completed'] as const).flatMap((status) =>
        SAMPLE_ROWS.map((row, position) => ({
          title: row.title,
          status,
          priority: row.priority,
          dueDate: new Date(row.dueDate),
          completedAt: status === 'completed' ? now : null,
          position,
          ownerId,
          assigneeId: ownerId,
          projectId: project.id,
        })),
      ),
    }),
    // A richer task backing the detail-page frame.
    //
    // Seeded into `todo`, not the `backlog` status the detail frame shows. The
    // Backlog group renders only when it holds tasks, so seeding one there
    // would put a fourth group on every guest's first screen where the design
    // draws three — and would make that conditional-rendering rule untestable,
    // since the group could never be empty.
    prisma.task.create({
      data: {
        title: 'Write API Documentation',
        description:
          'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.',
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2026-07-31'),
        startDate: new Date('2026-01-10'),
        position: SAMPLE_ROWS.length,
        ownerId,
        assigneeId: ownerId,
        projectId: project.id,
        labels: { connect: labels.map((label) => ({ id: label.id })) },
      },
    }),
  ]);

  await prisma.$transaction([
    prisma.task.createMany({
      data: SAMPLE_ROWS.map((row, index) => ({
        title: `Subtask ${index + 1}`,
        status: 'todo',
        priority: row.priority,
        dueDate: new Date(row.dueDate),
        position: index,
        ownerId,
        assigneeId: ownerId,
        parentId: detailed.id,
      })),
    }),
    // The frame's own comment body is `dsds` — keyboard mash left in the mock,
    // so the thread is seeded with real copy rather than reproducing the typo.
    prisma.comment.create({
      data: {
        body: 'Draft is ready for review — I left the auth section until the endpoints settle.',
        taskId: detailed.id,
        authorId: ownerId,
      },
    }),
    prisma.activity.createMany({
      data: [
        {
          type: 'priority_changed',
          message: 'changed priority from No priority to Urgent',
          taskId: detailed.id,
          actorId: ownerId,
        },
        {
          type: 'update_posted',
          message: 'posted an update',
          taskId: detailed.id,
          actorId: ownerId,
        },
      ],
    }),
  ]);
}
