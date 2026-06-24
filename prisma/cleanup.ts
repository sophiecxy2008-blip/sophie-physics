import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: "postgresql://localhost:5432/cie-physics",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const del = await prisma.question.deleteMany({
    where: { subject: { code: "9702" } },
  });
  console.log("Deleted", del.count, "A-Level questions");

  const total = await prisma.question.count();
  console.log("Remaining:", total, "questions");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
