import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      children: {
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { questions: true } },
        },
        orderBy: { orderIndex: "asc" },
      },
      parent: {
        select: { id: true, name: true },
      },
      subject: {
        select: { id: true, name: true, code: true, level: true },
      },
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({ topic });
}
