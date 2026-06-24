import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!;
const BASE_URL = "https://api.deepseek.com";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function deepseekJSON<T>(messages: { role: string; content: string }[]): Promise<T> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages,
      temperature: 0.5,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

function buildPrompt(
  topicPath: string,  // e.g. "Motion, Forces and Energy > Kinematics"
  subjectCode: string,
  count: number
) {
  return [
    {
      role: "system" as const,
      content: `You are a CIE IGCSE Physics (0625) exam writer. Generate ${count} high-quality physics questions for the specific topic below.

Topic: ${topicPath}

Requirements:
- ALL questions must test ONLY concepts within this specific topic
- Follow CIE IGCSE 0625 exam style (command words: state, describe, explain, calculate, determine)
- Vary difficulty: ~40% EASY, ~35% MEDIUM, ~20% HARD, ~5% VERY_HARD
- Mix question types: ~40% MCQ, ~40% NUMERIC calculation, ~20% TEXT
- Each MCQ must have exactly 4 options (A/B/C/D) with plausible distractors
- Numeric questions must specify the correct unit
- Each question must include a complete step-by-step explanation
- All Physics must be accurate and use correct SI units
- Use g = 10 m/s² unless specified otherwise (IGCSE convention)

Output as JSON:
{
  "questions": [
    {
      "stems": ["question text (use clear IGCSE language)"],
      "questionType": "MCQ",
      "difficulty": "EASY",
      "options": [{"label": "A", "text": "...", "isCorrect": false}, ...],
      "correctAnswer": "B",
      "marks": 1,
      "explanation": "step-by-step solution"
    },
    {
      "stems": ["A car of mass 800 kg accelerates..."],
      "questionType": "NUMERIC",
      "difficulty": "MEDIUM",
      "correctAnswer": "4.5",
      "answerUnit": "m/s²",
      "marks": 2,
      "explanation": "Using F=ma: ..."
    }
  ]
}`,
    },
    {
      role: "user" as const,
      content: `Generate ${count} IGCSE Physics 0625 questions for the topic: ${topicPath}`,
    },
  ];
}

async function generateForTopic(
  topicName: string,
  parentName: string | null,
  subjectId: string,
  topicId: string,
  subjectCode: string,
  count: number
) {
  const topicPath = parentName ? `${parentName} > ${topicName}` : topicName;
  const messages = buildPrompt(topicPath, subjectCode, count);

  console.log(`  🤖 Generating ${count} questions for: ${topicPath}...`);

  const result = await deepseekJSON<{
    questions: {
      stems: string[];
      questionType: string;
      difficulty: string;
      options?: { label: string; text: string; isCorrect: boolean }[] | null;
      correctAnswer: string;
      answerUnit?: string | null;
      marks?: number;
      explanation?: string;
    }[];
  }>(messages);

  if (!result.questions?.length) {
    console.log(`  ⚠️  No questions generated`);
    return 0;
  }

  let saved = 0;
  for (const q of result.questions) {
    // Validate difficulty
    const validDifficulty = ["EASY", "MEDIUM", "HARD", "VERY_HARD"].includes(q.difficulty)
      ? q.difficulty
      : "MEDIUM";
    const validType = ["MCQ", "NUMERIC", "TEXT", "MULTI_PART"].includes(q.questionType)
      ? q.questionType
      : "MCQ";

    try {
      await prisma.question.create({
        data: {
          subjectId,
          topicId,
          questionType: validType as "MCQ" | "NUMERIC" | "TEXT" | "MULTI_PART",
          difficulty: validDifficulty as "EASY" | "MEDIUM" | "HARD" | "VERY_HARD",
          stems: q.stems,
          options: q.options ?? undefined,
          correctAnswer: String(q.correctAnswer),
          answerUnit: q.answerUnit || null,
          marks: q.marks || 1,
          explanation: q.explanation || "",
          source: "AI_GENERATED",
          isVerified: false,
        },
      });
      saved++;
    } catch (e) {
      console.log(`  ⚠️  Failed to save question: ${(e as Error).message.slice(0, 100)}`);
    }
  }

  console.log(`  ✅ Saved ${saved}/${result.questions.length} questions`);
  return saved;
}

async function main() {
  console.log("🎯 IGCSE Physics AI Question Generator\n");

  const igcse = await prisma.subject.findUnique({ where: { code: "0625" } });
  if (!igcse) { console.log("IGCSE subject not found!"); return; }

  // Get all sub-topics (those with a parent)
  const subTopics = await prisma.topic.findMany({
    where: { subjectId: igcse.id, parentId: { not: null } },
    include: { parent: { select: { name: true } } },
    orderBy: { orderIndex: "asc" },
  });

  // Also get parent topics that don't have children
  const parentTopics = await prisma.topic.findMany({
    where: { subjectId: igcse.id, parentId: null },
    include: { _count: { select: { children: true } } },
  });

  console.log(`📚 Found ${subTopics.length} sub-topics and ${parentTopics.length} parent topics\n`);

  let totalGenerated = 0;

  // Generate for each sub-topic: 8 questions per topic
  for (let i = 0; i < subTopics.length; i++) {
    const t = subTopics[i];
    const existingCount = await prisma.question.count({
      where: { topicId: t.id },
    });

    if (existingCount >= 10) {
      console.log(`[${i + 1}/${subTopics.length}] ${t.parent?.name} > ${t.name} — already has ${existingCount} questions, skipping`);
      continue;
    }

    console.log(`[${i + 1}/${subTopics.length}]`);
    const count = await generateForTopic(
      t.name,
      t.parent?.name || null,
      igcse.id,
      t.id,
      "0625",
      8
    );
    totalGenerated += count;

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n🎉 Done! Total questions generated: ${totalGenerated}`);
  const totalInDb = await prisma.question.count({ where: { subjectId: igcse.id } });
  console.log(`📊 IGCSE question bank now has ${totalInDb} questions total`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
