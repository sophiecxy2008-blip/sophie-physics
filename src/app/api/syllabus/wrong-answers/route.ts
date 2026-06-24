import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get wrong answers grouped by topic for the current user
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { code } });
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const userId = session.user.id!;

  // Get all wrong answers for this subject, grouped by question topic
  const wrongResponses = await prisma.practiceResponse.findMany({
    where: {
      isCorrect: false,
      session: { userId },
      question: { subjectId: subject.id },
    },
    include: {
      question: {
        select: {
          id: true,
          stems: true,
          correctAnswer: true,
          answerUnit: true,
          explanation: true,
          topic: {
            select: {
              id: true,
              name: true,
              parent: { select: { id: true, name: true } },
            },
          },
        },
      },
      session: {
        select: { startedAt: true },
      },
    },
    orderBy: { respondedAt: "desc" },
  });

  // Group by topic
  const byTopic = new Map<string, {
    topicId: string;
    topicName: string;
    parentName: string | null;
    parentId: string | null;
    count: number;
    answers: {
      responseId: string;
      questionId: string;
      stem: string;
      userAnswer: string;
      correctAnswer: string;
      answerUnit: string | null;
      explanation: string | null;
      date: string;
    }[];
  }>();

  for (const r of wrongResponses) {
    const t = r.question.topic;
    const key = t.id;
    if (!byTopic.has(key)) {
      byTopic.set(key, {
        topicId: t.id,
        topicName: t.name,
        parentName: t.parent?.name || null,
        parentId: t.parent?.id || null,
        count: 0,
        answers: [],
      });
    }
    const entry = byTopic.get(key)!;
    entry.count++;
    entry.answers.push({
      responseId: r.id,
      questionId: r.question.id,
      stem: r.question.stems[0]?.slice(0, 150) || "Question",
      userAnswer: r.userAnswer || "",
      correctAnswer: r.question.correctAnswer,
      answerUnit: r.question.answerUnit,
      explanation: r.question.explanation,
      date: r.session.startedAt.toISOString(),
    });
  }

  const topics = Array.from(byTopic.values()).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    topics,
    totalWrong: wrongResponses.length,
  });
}
