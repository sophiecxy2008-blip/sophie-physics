import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const batchQuestionSchema = z.object({
  questions: z.array(
    z.object({
      subjectCode: z.enum(["0625", "9702"]),
      topicName: z.string().min(1),
      questionType: z.enum(["MCQ", "NUMERIC", "TEXT", "MULTI_PART"]),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]),
      stems: z.array(z.string()).min(1),
      options: z
        .array(
          z.object({
            label: z.string(),
            text: z.string(),
            isCorrect: z.boolean(),
          })
        )
        .optional()
        .nullable(),
      correctAnswer: z.string().min(1),
      answerUnit: z.string().optional().nullable(),
      marks: z.number().int().min(1).default(1),
      explanation: z.string().optional().nullable(),
      ciePaperRef: z.string().optional().nullable(),
    })
  ).min(1).max(500),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = batchQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "JSON 格式不正确", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { questions } = parsed.data;

  // Pre-load subjects and topic mappings
  const subjects = await prisma.subject.findMany();
  const subjectMap = new Map(subjects.map((s) => [s.code, s]));
  const topicCache = new Map<string, string>(); // key: "0625-Kinematics" -> topicId

  let imported = 0;
  const errors: { index: number; message: string }[] = [];

  // Use a transaction for performance
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    try {
      const subject = subjectMap.get(q.subjectCode);
      if (!subject) {
        errors.push({ index: i, message: `学科 ${q.subjectCode} 不存在` });
        continue;
      }

      // Find or cache topic
      const cacheKey = `${q.subjectCode}-${q.topicName}`;
      let topicId = topicCache.get(cacheKey);
      if (!topicId) {
        const topic = await prisma.topic.findFirst({
          where: { subjectId: subject.id, name: q.topicName },
        });
        if (!topic) {
          errors.push({ index: i, message: `章节 "${q.topicName}" (${q.subjectCode}) 未找到，请检查章节名称是否与大纲一致` });
          continue;
        }
        topicId = topic.id;
        topicCache.set(cacheKey, topicId);
      }

      // Create question
      await prisma.question.create({
        data: {
          subjectId: subject.id,
          topicId,
          questionType: q.questionType,
          difficulty: q.difficulty,
          stems: q.stems,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          answerUnit: q.answerUnit || null,
          marks: q.marks,
          explanation: q.explanation || null,
          ciePaperRef: q.ciePaperRef || null,
          source: "MANUAL",
          isVerified: true,
        },
      });
      imported++;
    } catch (e) {
      errors.push({ index: i, message: `数据库错误: ${(e as Error).message}` });
    }
  }

  return NextResponse.json({
    success: true,
    imported,
    errors: errors.length > 0 ? errors : undefined,
    total: questions.length,
  });
}
