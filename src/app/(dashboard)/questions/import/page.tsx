"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Upload, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const EXAMPLE_JSON = {
  questions: [
    {
      subjectCode: "0625",
      topicName: "Kinematics",
      questionType: "MCQ",
      difficulty: "EASY",
      stems: ["A cyclist travels 45 km in 3 hours. What is his average speed?"],
      options: [
        { label: "A", text: "10 km/h", isCorrect: false },
        { label: "B", text: "15 km/h", isCorrect: true },
        { label: "C", text: "20 km/h", isCorrect: false },
        { label: "D", text: "135 km/h", isCorrect: false },
      ],
      correctAnswer: "B",
      marks: 1,
      explanation: "speed = distance / time = 45 / 3 = 15 km/h",
      ciePaperRef: "0625/41/M/J/24 Q1",
    },
    {
      subjectCode: "9702",
      topicName: "Dynamics",
      questionType: "NUMERIC",
      difficulty: "MEDIUM",
      stems: ["A block of mass 2.5 kg slides down a frictionless incline of 30°. Calculate the component of weight parallel to the incline. (g = 9.81 m/s²)"],
      correctAnswer: "12.3",
      answerUnit: "N",
      marks: 3,
      explanation: "mg sin θ = 2.5 × 9.81 × sin(30°) = 12.3 N",
    },
  ],
};

export default function ImportQuestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors?: { index: number; message: string }[];
    total: number;
  } | null>(null);

  const handlePasteExample = () => {
    setJsonText(JSON.stringify(EXAMPLE_JSON, null, 2));
    setResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target?.result as string);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      toast("error", "请先粘贴 JSON 数据或上传文件");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      toast("error", "JSON 格式解析失败，请检查语法");
      return;
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      toast("error", 'JSON 必须包含 "questions" 数组');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/questions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        if (data.errors?.length) {
          toast("info", `导入 ${data.imported}/${data.total} 题，${data.errors.length} 题失败`);
        } else {
          toast("success", `成功导入 ${data.imported} 道题目！`);
        }
      } else {
        toast("error", data.error || "导入失败");
      }
    } catch {
      toast("error", "网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/questions">
          <Button variant="ghost" size="sm" className="rounded-full">
            <ArrowLeft className="h-4 w-4" /> 返回题库
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">批量导入题目</h1>
          <p className="text-slate-500 text-sm mt-1">粘贴 JSON 或上传 JSON 文件，一次最多 500 题</p>
        </div>
      </div>

      <Card className="border-slate-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📋 JSON 数据</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={handlePasteExample}>
                填入示例
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" className="rounded-full">
                  <Upload className="h-3.5 w-3.5" /> 上传文件
                </Button>
                <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full h-80 rounded-xl border border-slate-200 p-4 font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
            placeholder='点击"填入示例"查看格式，或直接把你的 JSON 粘贴到这里...'
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setResult(null); }}
          />
          <Button className="w-full rounded-xl" onClick={handleImport} disabled={loading || !jsonText.trim()}>
            {loading ? "导入中..." : "开始导入"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={`border ${result.errors?.length ? "border-amber-200" : "border-emerald-200"}`}>
          <CardContent className="py-5 space-y-3">
            <div className="flex items-center gap-3">
              {result.errors?.length ? (
                <XCircle className="h-6 w-6 text-amber-500" />
              ) : (
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              )}
              <div>
                <p className="font-semibold text-slate-800">
                  成功导入 {result.imported} / {result.total} 题
                </p>
                {result.errors?.length ? (
                  <p className="text-sm text-amber-600">{result.errors.length} 题导入失败</p>
                ) : (
                  <p className="text-sm text-emerald-600">全部导入成功！</p>
                )}
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-1 mt-3">
                <p className="text-sm font-medium text-slate-700">失败详情：</p>
                {result.errors.map((err, i) => (
                  <div key={i} className="rounded-lg bg-amber-50 p-3 text-sm text-slate-700">
                    <Badge variant="rose" className="mr-2">第 {err.index + 1} 题</Badge>
                    {err.message}
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/questions")}>
              回题库查看
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Format reference */}
      <Card className="border-slate-100 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">📖 JSON 字段说明</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2 pr-4">字段</th>
                <th className="pb-2 pr-4">必填</th>
                <th className="pb-2">说明</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr><td className="py-1.5 pr-4 font-mono text-xs">subjectCode</td><td className="py-1.5 pr-4 text-emerald-600">是</td><td className="py-1.5">0625 (IGCSE) 或 9702 (A-Level)</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">topicName</td><td className="py-1.5 pr-4 text-emerald-600">是</td><td className="py-1.5">章节名称，必须跟大纲一致 (如 &quot;Kinematics&quot;)</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">questionType</td><td className="py-1.5 pr-4 text-emerald-600">是</td><td className="py-1.5">MCQ / NUMERIC / TEXT / MULTI_PART</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">difficulty</td><td className="py-1.5 pr-4 text-emerald-600">是</td><td className="py-1.5">EASY / MEDIUM / HARD / VERY_HARD</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">stems</td><td className="py-1.5 pr-4 text-emerald-600">是</td><td className="py-1.5">题目文字数组，支持多部分题</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">options</td><td className="py-1.5 pr-4 text-slate-400">MCQ 必填</td><td className="py-1.5">{'[{label:"A", text:"...", isCorrect:true/false}]'}</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">correctAnswer</td><td className="py-1.5 pr-4 text-emerald-600">是</td><td className="py-1.5">正确答案 (MCQ 填字母, 计算题填数值)</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">answerUnit</td><td className="py-1.5 pr-4 text-slate-400">否</td><td className="py-1.5">单位, 如 &quot;m/s²&quot;</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">marks</td><td className="py-1.5 pr-4 text-slate-400">否</td><td className="py-1.5">分值，默认 1</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">explanation</td><td className="py-1.5 pr-4 text-slate-400">否</td><td className="py-1.5">答案解析</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">ciePaperRef</td><td className="py-1.5 pr-4 text-slate-400">否</td><td className="py-1.5">试卷引用, 如 &quot;0625/41/M/J/24 Q3&quot;</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
