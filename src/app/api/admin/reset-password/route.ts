import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Temporary endpoint - remove after use
const TEMP_KEY = "reset-admin-2024";

export async function POST(request: Request) {
  const body = await request.json();
  const { key, email, password } = body;

  if (key !== TEMP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { email },
      data: { hashedPassword },
      select: { id: true, email: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
