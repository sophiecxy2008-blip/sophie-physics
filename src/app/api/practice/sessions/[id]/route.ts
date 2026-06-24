import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const practiceSession = await prisma.practiceSession.findUnique({
    where: { id },
    include: {
      subject: true,
      responses: {
        include: {
          question: {
            include: {
              topic: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { respondedAt: "asc" },
      },
    },
  });

  if (!practiceSession || practiceSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ session: practiceSession });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existingSession = await prisma.practiceSession.findUnique({
    where: { id },
  });

  if (!existingSession || existingSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.practiceSession.update({
    where: { id },
    data: {
      status: body.status,
      completedAt: body.status === "COMPLETED" ? new Date() : undefined,
      score:
        body.status === "COMPLETED" && existingSession.totalQuestions > 0
          ? Math.round(
              (existingSession.correctCount / existingSession.totalQuestions) * 100
            )
          : undefined,
    },
  });

  return NextResponse.json({ session: updated });
}
