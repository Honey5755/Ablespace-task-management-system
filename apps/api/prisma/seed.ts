import { PrismaClient } from '@prisma/client';
import { seedWorkspace } from '../src/workspace/seed-workspace';

const prisma = new PrismaClient();

/**
 * Seeds the named demo workspace, so a fresh clone shows a populated list
 * without logging in as a guest first.
 *
 * The sample data itself lives in `seedWorkspace`, which guest login also
 * calls — one definition, so the two can't drift apart.
 */
const DEMO_EMAIL = 'demo@ablespace.test';

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

  // Idempotent: wipe the demo workspace before reseeding. Tasks cascade to
  // their subtasks, comments and activity.
  await prisma.task.deleteMany({ where: { ownerId: demo.id } });
  await prisma.project.deleteMany({ where: { ownerId: demo.id } });
  await prisma.label.deleteMany({ where: { ownerId: demo.id } });

  await seedWorkspace(prisma, demo.id);

  console.log(`Seeded demo workspace for ${DEMO_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
