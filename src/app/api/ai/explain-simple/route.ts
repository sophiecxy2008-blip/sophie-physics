import { NextResponse } from "next/server";

const KEY = process.env.DEEPSEEK_API_KEY;
const BASE = "https://api.deepseek.com";

export async function POST(request: Request) {
  const body = await request.json();
  const { stem, correctAnswer, userAnswer } = body;

  if (!stem || !correctAnswer) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是 CIE 物理老师。学生做错了一道题，请帮他分析。

1. 指出学生可能犯的错误
2. 解释正确的物理概念
3. 分步解答
4. 给一个考试技巧

用中文回答，markdown 格式，友好鼓励的语气。`,
          },
          {
            role: "user",
            content: `题目：${stem}\n正确答案：${correctAnswer}\n学生的错误答案：${userAnswer}\n\n请分析这道题。`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ content: data.choices[0].message.content });
  } catch {
    return NextResponse.json({ error: "AI 讲解失败" }, { status: 500 });
  }
}
