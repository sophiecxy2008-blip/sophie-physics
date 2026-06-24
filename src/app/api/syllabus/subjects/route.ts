import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const subjects = await prisma.subject.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      level: true,
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ subjects });
}
