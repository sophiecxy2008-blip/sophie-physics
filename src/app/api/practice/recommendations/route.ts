import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recommendQuestions } from "@/services/recommendation.service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const count = parseInt(searchParams.get("count") || "10", 10);

  if (!subjectId) {
    return NextResponse.json(
      { error: "subjectId is required" },
      { status: 400 }
    );
  }

  const questions = await recommendQuestions(
    session.user.id!,
    subjectId,
    count
  );

  return NextResponse.json({
    questions: questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(JSON.stringify(q.options)) : null,
    })),
  });
}
