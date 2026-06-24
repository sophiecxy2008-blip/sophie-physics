import { prisma } from "@/lib/prisma";

/**
 * Adaptive recommendation engine.
 * Scores candidate questions by:
 *   (1 - mastery) * 0.5  → prioritize weak topics
 *   (daysSinceLastPractice / 30) * 0.3  → spaced repetition
 *   (errorRate) * 0.2  → prioritize error-prone concepts
 */
export async function recommendQuestions(
  userId: string,
  subjectId: string,
  count: number = 20,
  topicIds?: string[]
) {
  // Get user progress for all topics in this subject
  const progress = await prisma.userProgress.findMany({
    where: {
      userId,
      topic: { subjectId },
    },
    select: {
      topicId: true,
      masteryLevel: true,
      questionsAnswered: true,
      questionsCorrect: true,
      lastPracticedAt: true,
    },
  });

  const progressMap = new Map(progress.map((p) => [p.topicId!, p]));

  // Get all topics for the subject (or filtered set)
  const topicWhere: Record<string, unknown> = { subjectId };
  if (topicIds?.length) {
    topicWhere.id = { in: topicIds };
  }

  const topics = await prisma.topic.findMany({
    where: topicWhere,
    select: { id: true, name: true },
  });

  // Build candidate questions from these topics
  const questions = await prisma.question.findMany({
    where: {
      subjectId,
      topicId: { in: topics.map((t) => t.id) },
    },
    include: {
      topic: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      _count: { select: { responses: true } },
    },
  });

  const now = Date.now();
  const scoredQuestions = questions.map((q) => {
    const prog = progressMap.get(q.topicId);
    const mastery = prog?.masteryLevel ?? 0;
    const lastPracticed = prog?.lastPracticedAt;
    const daysSince = lastPracticed
      ? Math.max(0, (now - lastPracticed.getTime()) / (1000 * 60 * 60 * 24))
      : 30; // never practiced → treat as 30 days

    const correct = prog?.questionsCorrect ?? 0;
    const answered = prog?.questionsAnswered ?? 0;
    const errorRate = answered > 0 ? 1 - correct / answered : 0.5;

    const score =
      (1 - mastery) * 0.5 +
      (daysSince / 30) * 0.3 +
      errorRate * 0.2 +
      Math.random() * 0.05; // small random factor to prevent repetition

    return { question: q, score };
  });

  // Sort by score descending, take top N
  scoredQuestions.sort((a, b) => b.score - a.score);

  // Balance: 60% weak topics, 25% medium, 15% mastered
  const weak = scoredQuestions.filter((s) => {
    const p = progressMap.get(s.question.topicId);
    return !p || p.masteryLevel < 0.5;
  });
  const medium = scoredQuestions.filter((s) => {
    const p = progressMap.get(s.question.topicId);
    return p && p.masteryLevel >= 0.5 && p.masteryLevel < 0.85;
  });
  const strong = scoredQuestions.filter((s) => {
    const p = progressMap.get(s.question.topicId);
    return p && p.masteryLevel >= 0.85;
  });

  const weakCount = Math.round(count * 0.6);
  const mediumCount = Math.round(count * 0.25);
  const strongCount = count - weakCount - mediumCount;

  const selected = [
    ...weak.slice(0, weakCount),
    ...medium.slice(0, mediumCount),
    ...strong.slice(0, strongCount),
  ];

  // Shuffle the final selection
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected.map((s) => s.question);
}
