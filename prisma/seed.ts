import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SEED_DATA } from "../src/services/seed.service";

const adapter = new PrismaPg({
  connectionString: "postgresql://localhost:5432/cie-physics",
});
const prisma = new PrismaClient({ adapter });

async function seedTopicTree(
  subjectId: string,
  topics: { name: string; description: string; children?: { name: string; description: string }[] }[]
) {
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    const parent = await prisma.topic.create({
      data: {
        name: t.name,
        description: t.description,
        orderIndex: i,
        subjectId,
      },
    });

    if (t.children) {
      for (let j = 0; j < t.children.length; j++) {
        const child = t.children[j];
        await prisma.topic.create({
          data: {
            name: child.name,
            description: child.description,
            orderIndex: j,
            subjectId,
            parentId: parent.id,
          },
        });
      }
    }
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.aiExplanation.deleteMany();
  await prisma.practiceResponse.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();

  // Create subjects
  for (const subj of SEED_DATA.subjects) {
    await prisma.subject.create({
      data: {
        name: subj.name,
        code: subj.code,
        level: subj.level,
      },
    });
  }

  // Seed IGCSE syllabus
  const igcseSubject = await prisma.subject.findUnique({
    where: { code: "0625" },
  });
  if (igcseSubject) {
    console.log("📚 Seeding IGCSE Physics (0625)...");
    await seedTopicTree(igcseSubject.id, SEED_DATA.igcseSyllabus);
    console.log("✅ IGCSE syllabus seeded");
  }

  // Seed A-Level syllabus
  const aLevelSubject = await prisma.subject.findUnique({
    where: { code: "9702" },
  });
  if (aLevelSubject) {
    console.log("📚 Seeding A-Level Physics (9702)...");
    await seedTopicTree(aLevelSubject.id, SEED_DATA.aLevelSyllabus);
    console.log("✅ A-Level syllabus seeded");
  }

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
