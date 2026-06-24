"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ArrowLeft, ChevronRight, Pencil, Lightbulb } from "lucide-react";
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/constants";

const difficultyVariant: Record<string, "emerald" | "sky" | "amber" | "rose"> = {
  EASY: "emerald",
  MEDIUM: "sky",
  HARD: "amber",
  VERY_HARD: "rose",
};

interface QuestionDetail {
  id: string;
  stems: string[];
  questionType: string;
  difficulty: string;
  options: { label: string; text: string; isCorrect: boolean }[] | null;
  correctAnswer: string;
  answerUnit: string | null;
  marks: number;
  explanation: string | null;
  ciePaperRef: string | null;
  source: string;
  topic: { id: string; name: string; parent: { id: string; name: string } | null };
  subject: { id: string; name: string; code: string };
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showAnswer, setShowAnswer] = useState(false);

  const { data, isLoading } = useQuery<{ question: QuestionDetail }>({
    queryKey: ["question", id],
    queryFn: () => fetch(`/api/questions/${id}`).then((r) => r.json()),
  });

  const question = data?.question;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">题目未找到</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/questions" className="hover:text-slate-600">题库</Link>
        <ChevronRight className="h-3 w-3" />
        {question.topic.parent && (
          <>
            <Link href={`/syllabus/${question.topic.parent.id}`} className="hover:text-slate-600">
              {question.topic.parent.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <Link href={`/syllabus/${question.topic.id}`} className="hover:text-slate-600">
          {question.topic.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700">题目详情</span>
      </div>

      {/* Question */}
      <Card className="border-slate-100">
        <CardContent className="py-5 space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={difficultyVariant[question.difficulty] || "default"}>
              {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
            </Badge>
            <Badge variant="sky">
              {QUESTION_TYPE_LABELS[question.questionType] || question.questionType}
            </Badge>
            <Badge variant="violet">{question.marks} 分</Badge>
            {question.ciePaperRef && (
              <Badge variant="amber">{question.ciePaperRef}</Badge>
            )}
          </div>

          {/* Stems */}
          <div className="space-y-3">
            {question.stems.map((stem, i) => (
              <p key={i} className="text-base text-slate-800 leading-relaxed">
                {question.stems.length > 1 && (
                  <span className="font-semibold text-emerald-600 mr-2">({String.fromCharCode(97 + i)})</span>
                )}
                {stem}
              </p>
            ))}
          </div>

          {/* MCQ Options */}
          {question.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {question.options.map((opt) => (
                <div
                  key={opt.label}
                  className="rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <span className="font-semibold text-slate-500 mr-2">{opt.label}.</span>
                  {opt.text}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer */}
      <Card className="border-slate-100">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              答案与解析
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? "隐藏答案" : "显示答案"}
            </Button>
          </div>

          {showAnswer && (
            <div className="space-y-3 pt-1">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-700 mb-1">正确答案</p>
                <p className="text-base font-semibold text-emerald-800">
                  {question.correctAnswer}
                  {question.answerUnit && (
                    <span className="text-sm font-normal ml-1">{question.answerUnit}</span>
                  )}
                </p>
              </div>

              {question.explanation && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">解析</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="rounded-full" onClick={() => router.push("/practice")}>
          <Pencil className="h-4 w-4" /> 去练习
        </Button>
        <Button variant="outline" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> 返回
        </Button>
      </div>
    </div>
  );
}
