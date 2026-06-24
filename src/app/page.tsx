import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BrainCircuit,
  Pencil,
  GraduationCap,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    color: "bg-emerald-100 text-emerald-600",
    title: "结构化知识大纲",
    description:
      "完整覆盖 IGCSE Physics 0625 和 A-Level Physics 9702 教学大纲。",
  },
  {
    icon: BrainCircuit,
    color: "bg-sky-100 text-sky-600",
    title: "自适应推荐引擎",
    description:
      "AI 根据你的薄弱环节和练习记录，智能推荐最适合的题目。",
  },
  {
    icon: Pencil,
    color: "bg-violet-100 text-violet-600",
    title: "智能练习系统",
    description:
      "选择题、计算题、简答题全覆盖，即时反馈对错。",
  },
  {
    icon: GraduationCap,
    color: "bg-amber-100 text-amber-600",
    title: "AI 物理导师",
    description:
      "每道错题都有 AI 分步讲解和考点剖析，真正理解物理。",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MainNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-700 mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          专为剑桥物理考生打造
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          AI 驱动的
          <span className="text-emerald-500"> CIE 物理</span> 复习平台
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-500 max-w-xl mx-auto">
          人工智能精准诊断薄弱环节，智能推荐练习题目，即时提供 AI 辅导。
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg" className="rounded-full px-8">
              免费开始 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="rounded-full px-8">
              已有账号？登录
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-100 bg-white p-6 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300"
            >
              <div
                className={`h-10 w-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
          >
            开始你的智能复习之旅
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        CIE Physics AI — 为剑桥物理考生打造的智能复习平台
      </footer>
    </div>
  );
}
