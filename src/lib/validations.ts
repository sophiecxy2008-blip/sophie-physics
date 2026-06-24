import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "请输入姓名"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少 6 位"),
    confirmPassword: z.string(),
    level: z.enum(["IGCSE", "AS_LEVEL", "A_LEVEL"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

// Server-side registration (no confirmPassword needed)
export const registerApiSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
  level: z.enum(["IGCSE", "AS_LEVEL", "A_LEVEL"]),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  level: z.enum(["IGCSE", "AS_LEVEL", "A_LEVEL"]).optional(),
});

// ─── Questions ─────────────────────────────────────────────

export const questionSchema = z.object({
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
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
});

export const questionFilterSchema = z.object({
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).optional(),
  questionType: z.enum(["MCQ", "NUMERIC", "TEXT", "MULTI_PART"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── Practice ──────────────────────────────────────────────

export const createSessionSchema = z.object({
  subjectId: z.string().min(1),
  mode: z.enum(["ADAPTIVE", "TOPIC_FOCUSED", "MISTAKE_REVIEW", "QUICK_DRILL"]),
  topicIds: z.array(z.string()).optional(),
  questionCount: z.number().int().min(5).max(50).default(20),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.string().min(1),
  timeTakenSec: z.number().int().min(0).optional(),
});

// ─── AI ────────────────────────────────────────────────────

export const aiExplainSchema = z.object({
  responseId: z.string().min(1),
  questionId: z.string().min(1),
  userAnswer: z.string(),
  type: z.enum(["WRONG_ANSWER", "STEP_BY_STEP", "CONCEPT_REVIEW", "EXAM_TIP"]),
});

export const aiSimilarQuestionSchema = z.object({
  questionId: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).optional(),
});
