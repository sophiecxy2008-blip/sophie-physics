"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWrongAnswersStore } from "@/stores/wrong-answers-store";
import { ArrowLeft, ChevronRight, XCircle, Lightbulb, ArrowRight, Trash2 } from "lucide-react";

export default function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const answers = useWrongAnswersStore((s) => s.answers);
  const removeAnswer = useWrongAnswersStore((s) => s.removeAnswer);

  const topicAnswers = answers.filter((a) => a.topicId === topicId);
  const topicName = topicAnswers[0]?.topicName || "章节";

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/syllabus" className="hover:text-slate-600">错题本</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700 font-medium">{topicName}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <XCircle className="h-6 w-6 text-rose-500" />
          {topicName}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">{topicAnswers.length} 道错题待复习</p>
      </div>

      {topicAnswers.length === 0 ? (
        <Card className="border-slate-100 border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">该章节暂无错题</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topicAnswers.map((a) => (
            <Card key={a.id} className="border-slate-100">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 leading-relaxed">{a.stem}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(a.date).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAnswer(a.id)}
                    className="text-slate-300 hover:text-rose-400 flex-shrink-0"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-rose-50 p-2.5">
                    <p className="text-xs text-rose-500 mb-0.5">你的答案 ❌</p>
                    <p className="font-medium text-rose-700">{a.userAnswer}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2.5">
                    <p className="text-xs text-emerald-500 mb-0.5">正确答案 ✅</p>
                    <p className="font-medium text-emerald-700">
                      {a.correctAnswer}
                      {a.answerUnit && <span className="text-sm font-normal ml-1">{a.answerUnit}</span>}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggle(a.id)}
                  className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {expanded.has(a.id) ? "收起解析" : "查看解析"}
                </button>

                {expanded.has(a.id) && a.explanation && (
                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {a.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="rounded-full" onClick={() => router.push("/syllabus")}>
          <ArrowLeft className="h-4 w-4" /> 返回错题本
        </Button>
        <Link href="/practice">
          <Button className="rounded-full">
            去练习 <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
