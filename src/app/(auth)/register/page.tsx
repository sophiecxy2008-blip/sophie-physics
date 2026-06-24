"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { registerSchema } from "@/lib/validations";
import { useToast } from "@/components/ui/toast";

const levelOptions = [
  { value: "IGCSE", label: "IGCSE Physics (0625)" },
  { value: "AS_LEVEL", label: "AS-Level Physics (9702)" },
  { value: "A_LEVEL", label: "A-Level Physics (9702)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [level, setLevel] = useState("IGCSE");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse({ name, email, password, confirmPassword, level });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const field = String(err.path[0]);
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, level }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast("error", data.error || "注册失败");
        setLoading(false);
        return;
      }

      toast("success", "注册成功！正在登录...");
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast("error", "注册失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-white">
      <Card className="w-full max-w-sm border-slate-100">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <CardTitle>创建账号</CardTitle>
          <p className="text-sm text-slate-500 mt-1">开始你的 CIE 物理学习之旅</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label htmlFor="name">姓名</Label>
              <Input id="name" placeholder="你的姓名" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            </div>
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            </div>
            <div>
              <Label htmlFor="level">课程等级</Label>
              <Select id="level" options={levelOptions} value={level} onChange={(e) => setLevel(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="至少 6 位" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input id="confirmPassword" type="password" placeholder="再次输入密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            已有账号？{" "}
            <Link href="/login" className="text-emerald-600 font-medium hover:underline">登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
