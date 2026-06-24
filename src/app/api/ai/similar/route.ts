import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deepseekChatJSON, buildSimilarQuestionPrompt } from "@/lib/deepseek";
import { aiSimilarQuestionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = aiSimilarQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { questionId, difficulty } = parsed.data;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      topic: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const targetDifficulty = difficulty || question.difficulty;

  const messages = buildSimilarQuestionPrompt(
    {
      stems: question.stems,
      questionType: question.questionType,
      difficulty: question.difficulty,
      options: question.options,
      correctAnswer: question.correctAnswer,
    },
    targetDifficulty
  );

  try {
    const generated = await deepseekChatJSON<{
      stems: string[];
      options: { label: string; text: string; isCorrect: boolean }[] | null;
      correctAnswer: string;
      answerUnit: string | null;
      marks: number;
      explanation: string;
      difficulty: string;
      questionType: string;
    }>(messages, { model: "deepseek-v4-pro", temperature: 0.5 });

    return NextResponse.json({
      question: {
        id: "ai-similar-" + Date.now(),
        stems: generated.stems,
        questionType: generated.questionType || question.questionType,
        difficulty: generated.difficulty || targetDifficulty,
        options: generated.options,
        correctAnswer: generated.correctAnswer,
        answerUnit: generated.answerUnit || null,
        marks: generated.marks || question.marks,
        explanation: generated.explanation,
        topic: { id: question.topic.id, name: question.topic.name },
        source: "AI_GENERATED",
      },
    });
  } catch (error) {
    console.error("AI similar question error:", error);
    return NextResponse.json(
      { error: "Failed to generate similar question" },
      { status: 500 }
    );
  }
}
