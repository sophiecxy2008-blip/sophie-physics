"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useWrongAnswersStore } from "@/stores/wrong-answers-store";
import {
  Sparkles, Check, Layers, CheckCircle, XCircle,
  ArrowRight, BrainCircuit,
} from "lucide-react";

interface ScoringPoint {
  keywords: string[];
  point: string;
  marks: number;
}

interface Question {
  id: string;
  stems: string[];
  questionType: string;
  difficulty: string;
  options?: { label: string; text: string; isCorrect: boolean }[] | null;
  correctAnswer: string;
  answerUnit?: string | null;
  marks: number;
  scoringPoints?: ScoringPoint[];
  explanation?: string;
  topicName: string;
  topicId: string;
}

const difficultyLabels: Record<string, string> = {
  EASY: "简单", MEDIUM: "中等", HARD: "困难", VERY_HARD: "非常困难",
};

export default function PracticePage() {
  const { data: session } = useSession();
  const subjectCode = session?.user?.level === "A_LEVEL" ? "9702" : "0625";

  // ─── Topic selection state ──────────────────────────────
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Active session state ───────────────────────────────
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswer?: string;
    answerUnit?: string | null;
    explanation?: string | null;
  } | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [scoreResult, setScoreResult] = useState<{
    pointResults: Array<{ point: string; keywords: string[]; marks: number; hit: boolean }>;
    earnedMarks: number;
    totalMarks: number;
  } | null>(null);

  // ─── Topic list ─────────────────────────────────────────
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ["topics", subjectCode],
    queryFn: () => fetch(`/api/syllabus/topics?code=${subjectCode}`).then((r) => r.json()),
  });

  const allTopics = useMemo(() => {
    if (!topicsData?.topics) return [];
    const flat: { id: string; name: string; parentName: string }[] = [];
    for (const chapter of topicsData.topics) {
      if (chapter.children.length > 0) {
        for (const child of chapter.children) {
          flat.push({ id: child.id, name: child.name, parentName: chapter.name });
        }
      } else {
        flat.push({ id: chapter.id, name: chapter.name, parentName: "" });
      }
    }
    return flat;
  }, [topicsData]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    setError("");
  };

  const selectAll = () => setSelectedTopics(new Set(allTopics.map((t) => t.id)));
  const clearAll = () => setSelectedTopics(new Set());
  const selectedList = allTopics.filter((t) => selectedTopics.has(t.id));

  // ─── Start session ──────────────────────────────────────
  const handleStart = async () => {
    if (selectedTopics.size === 0) { setError("请至少选择一个章节"); return; }
    setLoading(true); setError("");

    try {
      const topicInfo = selectedList.map((t) => ({ id: t.id, name: t.name, parentName: t.parentName || undefined }));
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectCode, topics: topicInfo, count: questionCount }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "出题失败"); setLoading(false); return; }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswer("");
      setLastResult(null);
      setAiExplanation(null);
      setScoreResult(null);
      setCorrectCount(0);
      setAnsweredCount(0);
      setSessionComplete(false);
      setLoading(false);
    } catch {
      setError("网络错误"); setLoading(false);
    }
  };

  const handleBackToSelect = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setLastResult(null);
    setAiExplanation(null);
      setScoreResult(null);
    setSessionComplete(false);
  };

  // ─── Answer handling ────────────────────────────────────
  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (!userAnswer.trim() || !currentQuestion) return;
    setSubmitting(true);

    const correctAnswer = currentQuestion.correctAnswer;
    let isCorrect = false;

    if (currentQuestion.questionType === "MCQ") {
      // Exact letter match
      isCorrect = userAnswer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
    } else if (currentQuestion.questionType === "NUMERIC") {
      // Strict numeric comparison, ±2%
      const u = parseFloat(userAnswer.trim());
      const c = parseFloat(correctAnswer.trim());
      if (isNaN(u)) {
        isCorrect = false; // not a number = wrong
      } else if (isNaN(c) || c === 0) {
        isCorrect = userAnswer.trim() === correctAnswer.trim(); // fallback to string
      } else {
        isCorrect = Math.abs(u - c) / Math.abs(c) <= 0.02;
      }
    } else {
      // TEXT: check against scoring points if available
      const scoringPoints = currentQuestion.scoringPoints;
      if (scoringPoints && scoringPoints.length > 0) {
        const userLower = userAnswer.toLowerCase();
        let earnedMarks = 0;
        const totalMarks = scoringPoints.reduce((s, p) => s + p.marks, 0);

        // Check each scoring point
        const pointResults = scoringPoints.map((sp) => {
          const hit = sp.keywords.some((kw) => userLower.includes(kw.toLowerCase()));
          if (hit) earnedMarks += sp.marks;
          return { ...sp, hit };
        });

        // Pass if earned >= 50% of total marks
        isCorrect = totalMarks > 0 && earnedMarks >= totalMarks * 0.5;
        // Store scoring results for display
        setScoreResult({ pointResults, earnedMarks, totalMarks });
      } else {
        // No scoring points — exact match fallback
        const a = userAnswer.toLowerCase().trim().replace(/\s+/g, " ");
        const b = correctAnswer.toLowerCase().trim().replace(/\s+/g, " ");
        isCorrect = a === b;
      }
    }

    const newCorrectCount = correctCount + (isCorrect ? 1 : 0);
    const newAnsweredCount = answeredCount + 1;
    setCorrectCount(newCorrectCount);
    setAnsweredCount(newAnsweredCount);

    setLastResult({
      isCorrect,
      correctAnswer,
      answerUnit: currentQuestion.answerUnit,
      explanation: currentQuestion.explanation,
    });

    // Save wrong answer
    if (!isCorrect) {
      useWrongAnswersStore.getState().addWrongAnswer({
        id: `wa-${Date.now()}`,
        questionId: currentQuestion.id,
        stem: currentQuestion.stems[0] || "",
        userAnswer: userAnswer.trim(),
        correctAnswer,
        answerUnit: currentQuestion.answerUnit || null,
        explanation: currentQuestion.explanation || null,
        topicId: currentQuestion.topicId || "",
        topicName: currentQuestion.topicName || "",
        parentName: null,
        date: new Date().toISOString(),
      });
    }

    setSubmitting(false);
  };

  const handleAskAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/explain-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stem: currentQuestion?.stems.join("\n") || "",
          correctAnswer: currentQuestion?.correctAnswer || "",
          userAnswer: userAnswer,
          type: "WRONG_ANSWER",
        }),
      });
      const data = await res.json();
      if (data.content) setAiExplanation(data.content);
    } catch { setAiExplanation("AI 讲解暂时不可用"); }
    finally { setAiLoading(false); }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setLastResult(null);
      setAiExplanation(null);
      setScoreResult(null);
    }
  };

  const handleRetry = () => {
    setUserAnswer("");
    setLastResult(null);
    setAiExplanation(null);
      setScoreResult(null);
  };

  // ─── Render: Topic Selection ────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI 智能出题</h1>
          <p className="text-slate-500 mt-1 text-sm">选章节 → AI 当场出题 → 做完即焚</p>
        </div>

        {topicsLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full rounded-xl" />))}</div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-500" /> 选择章节
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={selectAll}>全选</Button>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={clearAll}>清除</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allTopics.map((t) => (
                  <button key={t.id} onClick={() => toggleTopic(t.id)}
                    className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                      selectedTopics.has(t.id) ? "border-emerald-400 bg-emerald-50" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                    <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedTopics.has(t.id) ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                      {selectedTopics.has(t.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                      {t.parentName && <p className="text-xs text-slate-400 truncate">{t.parentName}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Card className="border-slate-100">
              <CardContent className="flex items-end gap-4 py-4 flex-wrap">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">题目数量</label>
                  <Select options={[{value:"5",label:"5 题"},{value:"10",label:"10 题"},{value:"15",label:"15 题"}]}
                    value={String(questionCount)} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-28" />
                </div>
                <div className="flex-1" />
                {selectedTopics.size > 0 && <Badge variant="emerald">已选 {selectedTopics.size} 个章节</Badge>}
                <Button size="lg" className="rounded-full px-8" onClick={handleStart} disabled={loading}>
                  {loading ? <>出题中...</> : <><Sparkles className="h-4 w-4" /> AI 出题开始</>}
                </Button>
              </CardContent>
            </Card>
            {error && <p className="text-sm text-rose-500 text-center">{error}</p>}
          </>
        )}
      </div>
    );
  }

  // ─── Render: Session Complete ───────────────────────────
  if (sessionComplete) {
    const acc = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    return (
      <div className="max-w-md mx-auto space-y-6 pt-8">
        <Card className="border-slate-100 text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">练习完成！</h2>
            <p className="text-slate-500 mb-2">共 {answeredCount} 道题</p>
            <p className="text-3xl font-bold text-emerald-600 mb-2">{acc}%</p>
            <p className="text-sm text-slate-400 mb-6">正确 {correctCount} / {answeredCount}</p>
            <div className="flex gap-3 justify-center">
              <Button className="rounded-full" onClick={handleBackToSelect}>再来一组</Button>
              <Button variant="outline" className="rounded-full" onClick={handleBackToSelect}>换章节</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render: Active Question ────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">第 {currentIndex + 1}/{questions.length} 题</span>
          <span className="text-slate-400">正确 {correctCount}/{answeredCount}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0}%` }} />
        </div>
      </div>

      <Card className="border-slate-100">
        <CardContent className="py-5 space-y-4">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="sky">{currentQuestion.topicName}</Badge>
            <Badge variant="emerald">{difficultyLabels[currentQuestion.difficulty] || currentQuestion.difficulty}</Badge>
            <span className="text-xs text-slate-400">{currentQuestion.marks} 分</span>
          </div>

          {/* Stems */}
          <div className="space-y-2">
            {currentQuestion.stems.map((s, i) => (
              <p key={i} className="text-base text-slate-800 leading-relaxed">
                {currentQuestion.stems.length > 1 && <span className="font-semibold text-emerald-600 mr-1">({String.fromCharCode(97+i)})</span>}
                {s}
              </p>
            ))}
          </div>

          {/* Answer input */}
          {!lastResult && (
            <div className="pt-2">
              {currentQuestion.questionType === "MCQ" && currentQuestion.options ? (
                <div className="grid grid-cols-1 gap-2">
                  {currentQuestion.options.map((opt) => (
                    <button key={opt.label} onClick={() => setUserAnswer(opt.label)}
                      className={`text-left rounded-xl border-2 p-3.5 text-sm transition-all ${
                        userAnswer === opt.label ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className="font-semibold text-slate-500 mr-2">{opt.label}.</span>
                      <span className="text-slate-700">{opt.text}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <Input placeholder={currentQuestion.questionType === "NUMERIC" ? "输入数值答案" : "输入答案"}
                  value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              )}
              <Button className="w-full rounded-xl mt-3" onClick={handleSubmit} disabled={!userAnswer.trim() || submitting}>
                {submitting ? "提交中..." : "提交答案"}
              </Button>
            </div>
          )}

          {/* Feedback */}
          {lastResult && (
            <div className="space-y-3 pt-2">
              <div className={`rounded-xl p-4 ${lastResult.isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                <div className="flex items-center gap-2">
                  {lastResult.isCorrect ? (
                    <><CheckCircle className="h-5 w-5 text-emerald-500" /><span className="font-semibold text-emerald-700">回答正确！</span></>
                  ) : (
                    <><XCircle className="h-5 w-5 text-rose-500" /><span className="font-semibold text-rose-700">回答错误</span></>
                  )}
                </div>
                {lastResult.correctAnswer && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-1">正确答案</p>
                    <p className="text-base font-semibold text-slate-800">
                      {lastResult.correctAnswer}{lastResult.answerUnit && <span className="text-sm font-normal ml-1">{lastResult.answerUnit}</span>}
                    </p>
                  </div>
                )}
                {/* Scoring points breakdown for TEXT questions */}
                {currentQuestion.scoringPoints && scoreResult && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500 mb-2">📋 得分点</p>
                    <div className="space-y-1.5">
                      {scoreResult.pointResults.map((pr, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm rounded-lg p-2 ${pr.hit ? "bg-emerald-100/50" : "bg-slate-200/50"}`}>
                          <span>{pr.hit ? "✅" : "❌"}</span>
                          <div className="flex-1">
                            <span className="text-slate-700">{pr.point}</span>
                            <span className="text-xs text-slate-400 ml-2">({pr.keywords.join(", ")})</span>
                          </div>
                          <Badge variant={pr.hit ? "emerald" : "rose"}>{pr.hit ? "+" : "0/"}{pr.marks}分</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm font-semibold text-slate-600">
                        得分 {scoreResult.earnedMarks}/{scoreResult.totalMarks}
                      </span>
                    </div>
                  </div>
                )}

                {lastResult.explanation && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">📖 解析</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{lastResult.explanation}</p>
                  </div>
                )}
              </div>

              {!aiExplanation && (
                <Button variant="outline" className="w-full rounded-xl" onClick={handleAskAI} disabled={aiLoading}>
                  <BrainCircuit className="h-4 w-4" /> {aiLoading ? "AI 思考中..." : "AI 老师详细讲解"}
                </Button>
              )}

              {aiExplanation && (
                <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-semibold text-violet-700">AI 老师讲解</span>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiExplanation}</div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={handleRetry}>重试本题</Button>
                <Button className="rounded-xl flex-1" onClick={handleNext}>
                  {currentIndex + 1 >= questions.length ? "完成练习" : "下一题"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" className="rounded-full" onClick={handleBackToSelect}>← 返回选题</Button>
      </div>
    </div>
  );
}
