import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [totalResponses, totalCorrect, totalSessions, sessionMinutes] =
    await Promise.all([
      prisma.practiceResponse.count({
        where: { session: { userId } },
      }),
      prisma.practiceResponse.count({
        where: { session: { userId }, isCorrect: true },
      }),
      prisma.practiceSession.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.practiceSession.findMany({
        where: { userId, status: "COMPLETED" },
        select: { startedAt: true, completedAt: true },
      }),
    ]);

  const totalMinutes = sessionMinutes.reduce((acc, s) => {
    if (s.completedAt) {
      return (
        acc +
        (s.completedAt.getTime() - s.startedAt.getTime()) / 1000 / 60
      );
    }
    return acc;
  }, 0);

  const weakTopics = await prisma.userProgress.count({
    where: { userId, masteryLevel: { lt: 0.5 } },
  });

  const strongTopics = await prisma.userProgress.count({
    where: { userId, masteryLevel: { gte: 0.85 } },
  });

  return NextResponse.json({
    totalQuestions: totalResponses,
    accuracy:
      totalResponses > 0
        ? Math.round((totalCorrect / totalResponses) * 100)
        : 0,
    totalSessions,
    studyMinutes: Math.round(totalMinutes),
    weakTopics,
    strongTopics,
  });
}
