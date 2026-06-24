import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionSchema, questionFilterSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = questionFilterSchema.safeParse({
    subjectId: searchParams.get("subjectId") || undefined,
    topicId: searchParams.get("topicId") || undefined,
    difficulty: searchParams.get("difficulty") || undefined,
    questionType: searchParams.get("questionType") || undefined,
    page: searchParams.get("page") || "1",
    pageSize: searchParams.get("pageSize") || "20",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { subjectId, topicId, difficulty, questionType, page, pageSize } =
    parsed.data;

  const where: Record<string, unknown> = {};
  if (subjectId) where.subjectId = subjectId;
  if (topicId) where.topicId = topicId;
  if (difficulty) where.difficulty = difficulty;
  if (questionType) where.questionType = questionType;

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        topic: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.question.count({ where }),
  ]);

  return NextResponse.json({ questions, total, page, pageSize });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid question data", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const question = await prisma.question.create({
    data: {
      ...parsed.data,
      options: parsed.data.options ?? undefined,
    },
    include: {
      topic: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ question }, { status: 201 });
}
