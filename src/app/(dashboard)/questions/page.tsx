"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronRight, Search, MessageSquareText } from "lucide-react";
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/constants";
import { useState } from "react";

const difficultyVariant: Record<string, "emerald" | "sky" | "amber" | "rose"> = {
  EASY: "emerald",
  MEDIUM: "sky",
  HARD: "amber",
  VERY_HARD: "rose",
};

const difficultyOptions = [
  { value: "", label: "全部难度" },
  { value: "EASY", label: "简单" },
  { value: "MEDIUM", label: "中等" },
  { value: "HARD", label: "困难" },
  { value: "VERY_HARD", label: "非常困难" },
];

const typeOptions = [
  { value: "", label: "全部类型" },
  { value: "MCQ", label: "选择题" },
  { value: "NUMERIC", label: "计算题" },
  { value: "TEXT", label: "简答题" },
  { value: "MULTI_PART", label: "多部分题" },
];

interface Question {
  id: string;
  stems: string[];
  questionType: string;
  difficulty: string;
  marks: number;
  source: string;
  topic: { id: string; name: string };
  subject: { id: string; name: string; code: string };
  createdAt: string;
}

export default function QuestionsPage() {
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [search, setSearch] = useState("");

  const params = new URLSearchParams();
  if (difficulty) params.set("difficulty", difficulty);
  if (questionType) params.set("questionType", questionType);

  const { data, isLoading } = useQuery<{ questions: Question[]; total: number }>({
    queryKey: ["questions", difficulty, questionType],
    queryFn: () =>
      fetch(`/api/questions?${params.toString()}&pageSize=50`).then((r) => r.json()),
  });

  const questions = data?.questions || [];
  const total = data?.total || 0;

  const filtered = search
    ? questions.filter((q) =>
        q.stems.some((s) => s.toLowerCase().includes(search.toLowerCase()))
      )
    : questions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">题库管理</h1>
        <p className="text-slate-500 mt-1 text-sm">共 {total} 道题</p>
      </div>

      {/* Filters */}
      <Card className="border-slate-100">
        <CardContent className="flex flex-wrap gap-3 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索题目..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={difficultyOptions}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-32"
          />
          <Select
            options={typeOptions}
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            className="w-32"
          />
        </CardContent>
      </Card>

      {/* Question list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-slate-100 border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquareText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">没有找到匹配的题目</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <Link
              key={q.id}
              href={`/questions/${q.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 hover:border-emerald-200 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">
                  {q.stems[0]?.slice(0, 120)}
                  {(q.stems[0]?.length || 0) > 120 ? "..." : ""}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={difficultyVariant[q.difficulty] || "default"}>
                    {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
                  </Badge>
                  <Badge variant="default">
                    {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                  </Badge>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{q.topic.name}</span>
                  <span className="text-xs text-slate-400">· {q.marks} 分</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-400 transition-colors ml-3 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
