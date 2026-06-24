import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let subjectId = searchParams.get("subjectId");
  const code = searchParams.get("code");

  if (!subjectId && !code) {
    return NextResponse.json(
      { error: "subjectId or code is required" },
      { status: 400 }
    );
  }

  // Resolve by code if provided
  if (code && !subjectId) {
    const subject = await prisma.subject.findUnique({ where: { code } });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    subjectId = subject.id;
  }

  if (!subjectId) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  // Fetch all topics and build a tree
  const topics = await prisma.topic.findMany({
    where: { subjectId: subjectId },
    select: {
      id: true,
      name: true,
      description: true,
      orderIndex: true,
      parentId: true,
      _count: {
        select: {
          questions: true,
          children: true,
        },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  // Build tree structure
  const roots = topics.filter((t) => !t.parentId);
  const tree = roots.map((root) => ({
    ...root,
    children: topics.filter((t) => t.parentId === root.id),
  }));

  return NextResponse.json({ topics: tree });
}
