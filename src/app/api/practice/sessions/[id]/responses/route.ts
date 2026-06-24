import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitAnswerSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;

  const practiceSession = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
  });

  if (!practiceSession || practiceSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (practiceSession.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Session is not in progress" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = submitAnswerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { questionId, userAnswer, timeTakenSec } = parsed.data;

  // Accept question snapshot from client (for AI-generated questions that aren't in DB)
  const questionSnapshot = (body as Record<string, unknown>).questionSnapshot as {
    stems?: string[];
    questionType?: string;
    correctAnswer?: string;
    answerUnit?: string | null;
    explanation?: string | null;
    topicId?: string;
    topicName?: string;
  } | undefined;

  // Check for duplicate response
  const existing = await prisma.practiceResponse.findUnique({
    where: {
      sessionId_questionId: { sessionId, questionId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Question already answered" },
      { status: 409 }
    );
  }

  // Try DB first, fall back to snapshot
  const question = await prisma.question.findUnique({ where: { id: questionId } });

  // If not in DB (AI-generated), use the snapshot
  if (!question && questionSnapshot) {
    // Score the answer from snapshot
    const correctAnswer = questionSnapshot.correctAnswer || "";
    const qType = questionSnapshot.questionType || "MCQ";
    let isCorrect = false;

    if (qType === "MCQ") {
      isCorrect = userAnswer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
    } else if (qType === "NUMERIC") {
      const userNum = parseFloat(userAnswer.trim());
      const correctNum = parseFloat(correctAnswer.trim());
      if (isNaN(userNum)) {
        isCorrect = false;
      } else if (isNaN(correctNum) || correctNum === 0) {
        isCorrect = userAnswer.trim() === correctAnswer.trim();
      } else {
        isCorrect = Math.abs(userNum - correctNum) / Math.abs(correctNum) <= 0.02;
      }
    } else {
      const a = userAnswer.toLowerCase().trim().replace(/\s+/g, " ");
      const b = correctAnswer.toLowerCase().trim().replace(/\s+/g, " ");
      isCorrect = a === b;
    }

    const response = await prisma.practiceResponse.create({
      data: { sessionId, questionId, userAnswer: userAnswer.trim(), isCorrect, timeTakenSec },
    });

    const updatedSession = await prisma.practiceSession.update({
      where: { id: sessionId },
      data: { answeredCount: { increment: 1 }, correctCount: isCorrect ? { increment: 1 } : undefined },
    });

    return NextResponse.json({
      response,
      isCorrect,
      correctAnswer,
      answerUnit: questionSnapshot.answerUnit || null,
      explanation: questionSnapshot.explanation || null,
      sessionProgress: { answered: updatedSession.answeredCount, total: updatedSession.totalQuestions },
    });
  }

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Score the answer (from DB question)
  let isCorrect = false;

  if (question.questionType === "MCQ") {
    // MCQ: case-insensitive match
    isCorrect =
      userAnswer.trim().toUpperCase() ===
      question.correctAnswer.trim().toUpperCase();
  } else if (question.questionType === "NUMERIC") {
    // Numeric: ±2% tolerance
    const userNum = parseFloat(userAnswer.trim());
    const correctNum = parseFloat(question.correctAnswer.trim());
    if (!isNaN(userNum) && !isNaN(correctNum) && correctNum !== 0) {
      isCorrect = Math.abs(userNum - correctNum) / Math.abs(correctNum) <= 0.02;
    }
  } else {
    // Text: keyword intersection (simple approach)
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = question.correctAnswer.toLowerCase().trim();
    // Check if the correct answer is contained within user answer (fuzzy)
    isCorrect =
      userLower.includes(correctLower) ||
      correctLower.includes(userLower) ||
      userLower === correctLower;
  }

  // Create response
  const response = await prisma.practiceResponse.create({
    data: {
      sessionId,
      questionId,
      userAnswer: userAnswer.trim(),
      isCorrect,
      timeTakenSec,
    },
  });

  // Update session counters
  const updatedSession = await prisma.practiceSession.update({
    where: { id: sessionId },
    data: {
      answeredCount: { increment: 1 },
      correctCount: isCorrect ? { increment: 1 } : undefined,
    },
  });

  // Update user progress for this topic
  const existingProgress = await prisma.userProgress.findFirst({
    where: {
      userId: session.user.id!,
      topicId: question.topicId,
    },
  });

  if (existingProgress) {
    const newMastery =
      existingProgress.masteryLevel * 0.7 + (isCorrect ? 1 : 0) * 0.3;
    await prisma.userProgress.update({
      where: { id: existingProgress.id },
      data: {
        masteryLevel: newMastery,
        questionsAnswered: { increment: 1 },
        questionsCorrect: isCorrect ? { increment: 1 } : undefined,
        streakCount: isCorrect
          ? { increment: 1 }
          : 0,
        lastPracticedAt: new Date(),
      },
    });
  } else {
    await prisma.userProgress.create({
      data: {
        userId: session.user.id!,
        topicId: question.topicId,
        masteryLevel: isCorrect ? 0.3 : 0.0,
        questionsAnswered: 1,
        questionsCorrect: isCorrect ? 1 : 0,
        streakCount: isCorrect ? 1 : 0,
        lastPracticedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    response,
    isCorrect,
    correctAnswer: question.correctAnswer,
    answerUnit: question.answerUnit,
    explanation: question.explanation,
    sessionProgress: {
      answered: updatedSession.answeredCount,
      total: updatedSession.totalQuestions,
    },
  });
}
