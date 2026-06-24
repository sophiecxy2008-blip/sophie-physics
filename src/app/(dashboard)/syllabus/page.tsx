"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWrongAnswersStore } from "@/stores/wrong-answers-store";
import { BookOpen, ChevronRight, XCircle } from "lucide-react";

export default function SyllabusPage() {
  const answers = useWrongAnswersStore((s) => s.answers);

  // Group by topic
  const byTopic = useMemo(() => {
    const map = new Map<string, {
      topicId: string;
      topicName: string;
      count: number;
    }>();
    for (const a of answers) {
      const key = a.topicId || a.topicName;
      if (!map.has(key)) {
        map.set(key, { topicId: a.topicId, topicName: a.topicName, count: 0 });
      }
      map.get(key)!.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [answers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <XCircle className="h-6 w-6 text-rose-500" />
          错题本
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          做错的题目自动保存在这里（浏览器本地存储），按章节分类复习。共 {answers.length} 道错题。
        </p>
      </div>

      {byTopic.length === 0 ? (
        <Card className="border-slate-100 border-dashed">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">还没有错题</p>
            <p className="text-sm text-slate-400 mt-1">
              去练习吧，做错的题目会自动出现在这里
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {byTopic.map((t) => (
            <Link key={t.topicId} href={`/syllabus/${t.topicId}`}>
              <Card className="border-slate-100 hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t.topicName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="rose">{t.count} 道错题</Badge>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
