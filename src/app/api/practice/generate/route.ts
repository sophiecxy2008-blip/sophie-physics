import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subjectCode, topics, count = 5 } = body;

  if (!subjectCode || !topics?.length) {
    return NextResponse.json(
      { error: "subjectCode and topics are required" },
      { status: 400 }
    );
  }

  const subject = await prisma.subject.findUnique({ where: { code: subjectCode } });
  if (!subject) {
    return NextResponse.json({ error: `Subject not found` }, { status: 404 });
  }

  const topicNames = topics
    .map((t: { name: string; parentName?: string }) =>
      t.parentName ? `${t.parentName} > ${t.name}` : t.name
    )
    .join(", ");

  const g = subjectCode === "0625" ? "10 m/s²" : "9.81 m/s²";

  const messages = [
    {
      role: "system" as const,
      content: `You are a CIE ${subjectCode} Physics exam writer. Generate ${count} challenging questions for: ${topicNames}.

STRICT RULES:
- Mix: ~30% MEDIUM, ~50% HARD, ~20% VERY_HARD. NEVER generate EASY questions.
- Mix types: ~35% MCQ, ~45% NUMERIC, ~20% TEXT
- MCQ must have exactly 4 options with plausible distractors
- NUMERIC questions must include the correct unit in answerUnit
- Every question must have a detailed step-by-step explanation
- Be creative — varied scenarios, never repeat patterns
- All physics must be correct. Use g = ${g}.
- For IGCSE (0625), use simple clear language appropriate for high school students

For TEXT questions, you MUST include "scoringPoints" — an array of scoring criteria. Each point has "keywords" (English keywords that must appear in answer), "point" (point description in English), and "marks" (point value). The sum of scoringPoints marks must equal the question's total marks.

Output ONLY valid JSON:
{"questions":[{"stems":["question text"],"questionType":"TEXT","difficulty":"HARD","correctAnswer":"Full model answer","marks":3,"scoringPoints":[{"keywords":["keyword1","keyword2"],"point":"Description of point 1","marks":1},{"keywords":["keyword3"],"point":"Description of point 2","marks":2}],"explanation":"Step-by-step solution"}]}`,
    },
    {
      role: "user" as const,
      content: `Generate ${count} ${subjectCode} Physics questions for: ${topicNames}`,
    },
  ];

  console.log(`[generate] Requesting ${count} questions for ${topicNames}...`);

  // Retry up to 3 times with backoff
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = `API ${res.status}: ${errText.slice(0, 100)}`;
        console.error(`[generate] Attempt ${attempt} failed:`, lastError);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      const data = await res.json();
      const content = data.choices[0].message.content;
      console.log(`[generate] Attempt ${attempt} OK, finish: ${data.choices[0].finish_reason}, length: ${content.length}`);

      // Parse JSON
      let jsonStr = content.trim();
      const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlock) jsonStr = codeBlock[1].trim();

      const parsed = JSON.parse(jsonStr);

      if (!parsed.questions?.length) {
        lastError = "No questions in response";
        console.error(`[generate] Attempt ${attempt}:`, lastError);
        if (attempt < 3) { await new Promise((r) => setTimeout(r, 1000)); continue; }
        return NextResponse.json({ error: "AI returned no questions" }, { status: 500 });
      }

      // Map to frontend format
      const validDifficulties = ["EASY", "MEDIUM", "HARD", "VERY_HARD"];
      const validTypes = ["MCQ", "NUMERIC", "TEXT", "MULTI_PART"];

      const questions = parsed.questions.map((q: Record<string, unknown>, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        stems: Array.isArray(q.stems) && q.stems.length > 0 ? q.stems : ["Question"],
        questionType: validTypes.includes(q.questionType as string) ? q.questionType : "MCQ",
        difficulty: validDifficulties.includes(q.difficulty as string) ? q.difficulty : "MEDIUM",
        options: q.options || null,
        correctAnswer: String(q.correctAnswer || ""),
        answerUnit: q.answerUnit || null,
        marks: Number(q.marks) || 1,
        scoringPoints: Array.isArray(q.scoringPoints) ? q.scoringPoints : undefined,
        explanation: String(q.explanation || ""),
        topicName: topics[i % topics.length]?.name || topics[0]?.name || "",
        topicId: topics[i % topics.length]?.id || topics[0]?.id || "",
      }));

      const practiceSession = await prisma.practiceSession.create({
        data: {
          userId: session.user.id!,
          subjectId: subject.id,
          mode: "ADAPTIVE",
          totalQuestions: questions.length,
          metadata: { topics, generated: true },
        },
      });

      console.log(`[generate] Success: ${questions.length} questions`);
      return NextResponse.json({ session: practiceSession, questions });

    } catch (e) {
      lastError = (e as Error).message;
      console.error(`[generate] Attempt ${attempt} error:`, lastError);
      if (attempt < 3) { await new Promise((r) => setTimeout(r, 1000 * attempt)); continue; }
    }
  }

  // All retries exhausted
  console.error("[generate] All retries failed:", lastError);
  return NextResponse.json(
    { error: `出题失败（${lastError.slice(0, 50)}），请重试` },
    { status: 500 }
  );
}
