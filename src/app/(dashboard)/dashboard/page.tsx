import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, TrendingUp, Clock, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [progress, recentSessions, totalResponses] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId },
      include: { topic: { select: { name: true } } },
      orderBy: { masteryLevel: "asc" },
      take: 5,
    }),
    prisma.practiceSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { subject: { select: { name: true, code: true } } },
    }),
    prisma.practiceResponse.count({ where: { session: { userId } } }),
  ]);

  const totalCorrect = await prisma.practiceResponse.count({
    where: { session: { userId }, isCorrect: true },
  });

  const accuracy = totalResponses > 0 ? Math.round((totalCorrect / totalResponses) * 100) : 0;
  const weakTopics = progress.filter((p) => p.masteryLevel < 0.5).length;
  const strongTopics = progress.filter((p) => p.masteryLevel >= 0.85).length;

  const stats = [
    { icon: BookOpen, color: "bg-emerald-100 text-emerald-600", label: "已完成题目", value: totalResponses },
    { icon: Target, color: "bg-sky-100 text-sky-600", label: "正确率", value: `${accuracy}%` },
    { icon: TrendingUp, color: "bg-violet-100 text-violet-600", label: "已掌握章节", value: strongTopics },
    { icon: Clock, color: "bg-amber-100 text-amber-600", label: "薄弱章节", value: weakTopics },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          欢迎回来，{session.user.name || "同学"} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {session.user.level === "IGCSE" ? "IGCSE Physics 0625" : "A-Level Physics 9702"} · 智能复习仪表盘
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-slate-100">
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`h-9 w-9 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weak topics */}
        <Card className="border-slate-100">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-800 text-sm">需要复习的章节</h3>
          </div>
          <div className="px-5 py-3">
            {progress.filter((p) => p.masteryLevel < 0.5).length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">暂无薄弱章节，继续保持！</p>
            ) : (
              <div className="space-y-2">
                {progress
                  .filter((p) => p.masteryLevel < 0.5)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{p.topic?.name || "未知"}</p>
                        <p className="text-xs text-slate-400">
                          答题 {p.questionsAnswered} 次 · 正确 {p.questionsCorrect} 次
                        </p>
                      </div>
                      <Badge variant="rose">掌握度 {Math.round(p.masteryLevel * 100)}%</Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent sessions */}
        <Card className="border-slate-100">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-800 text-sm">最近练习</h3>
          </div>
          <div className="px-5 py-3">
            {recentSessions.length === 0 ? (
              <div className="text-center py-6">
                <Zap className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-4">还没有练习记录</p>
                <Link href="/practice">
                  <Button size="sm" className="rounded-full">
                    开始第一次练习 <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentSessions.map((s) => (
                  <Link
                    key={s.id}
                    href="/practice"
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{s.subject.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(s.startedAt).toLocaleDateString("zh-CN")} ·{" "}
                        {s.status === "COMPLETED" ? `得分 ${s.score}%` : s.status === "IN_PROGRESS" ? "进行中" : "已放弃"}
                      </p>
                    </div>
                    <Badge
                      variant={s.status === "COMPLETED" ? "emerald" : s.status === "IN_PROGRESS" ? "sky" : "default"}
                    >
                      {s.answeredCount}/{s.totalQuestions} 题
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/practice">
          <Button className="rounded-full">
            <Zap className="h-4 w-4" /> 智能练习
          </Button>
        </Link>
        <Link href="/syllabus">
          <Button variant="outline" className="rounded-full">错题本</Button>
        </Link>
        <Link href="/questions">
          <Button variant="outline" className="rounded-full">题库管理</Button>
        </Link>
      </div>
    </div>
  );
}
