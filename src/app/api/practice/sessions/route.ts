import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSessionSchema } from "@/lib/validations";
import { recommendQuestions } from "@/services/recommendation.service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;

  const sessions = await prisma.practiceSession.findMany({
    where,
    include: { subject: { select: { name: true, code: true } } },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { subjectId, mode, topicIds, questionCount, difficulty } = parsed.data;

  // Get recommended questions
  let questions: Record<string, unknown>[];
  if (mode === "TOPIC_FOCUSED" && topicIds?.length) {
    questions = await recommendQuestions(
      session.user.id!,
      subjectId,
      questionCount,
      topicIds
    );
  } else if (mode === "ADAPTIVE") {
    questions = await recommendQuestions(
      session.user.id!,
      subjectId,
      questionCount
    );
  } else if (mode === "QUICK_DRILL") {
    // Random questions for quick drill
    const where: Record<string, unknown> = { subjectId };
    if (difficulty) where.difficulty = difficulty;

    questions = await prisma.question.findMany({
      where,
      take: questionCount,
      orderBy: { usageCount: "asc" },
    });
  } else if (mode === "MISTAKE_REVIEW") {
    // Questions the user previously got wrong
    const wrongResponses = await prisma.practiceResponse.findMany({
      where: {
        session: { userId: session.user.id },
        isCorrect: false,
      },
      select: { questionId: true },
      distinct: ["questionId"],
      take: questionCount,
    });

    if (wrongResponses.length > 0) {
      questions = await prisma.question.findMany({
        where: { id: { in: wrongResponses.map((r) => r.questionId) } },
        take: questionCount,
      });
    } else {
      questions = [];
    }
  } else {
    questions = await prisma.question.findMany({
      where: { subjectId },
      take: questionCount,
    });
  }

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No questions available for this selection" },
      { status: 404 }
    );
  }

  // Create the session
  const practiceSession = await prisma.practiceSession.create({
    data: {
      userId: session.user.id!,
      subjectId,
      mode,
      totalQuestions: questions.length,
      metadata: { topicIds, difficulty },
    },
    include: { subject: true },
  });

  // Increment usage count for selected questions
  await prisma.question.updateMany({
    where: { id: { in: (questions as { id: string }[]).map((q) => q.id) } },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json(
    {
      session: practiceSession,
      questions: questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(JSON.stringify(q.options)) : null,
      })),
    },
    { status: 201 }
  );
}
