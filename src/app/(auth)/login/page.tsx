"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { loginSchema } from "@/lib/validations";
import { useToast } from "@/components/ui/toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      parsed.error.issues.forEach((err) => {
        const field = String(err.path[0]);
        if (field === "email" || field === "password") fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast("error", "邮箱或密码错误");
      } else {
        toast("success", "登录成功！");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast("error", "登录失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <Card className="w-full max-w-sm border-slate-100">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <CardTitle>欢迎回来</CardTitle>
          <p className="text-sm text-slate-500 mt-1">登录你的 CIE Physics AI 账号</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>{loading ? "登录中..." : "登录"}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            还没有账号？{" "}
            <Link href="/register" className="text-emerald-600 font-medium hover:underline">注册</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse h-8 w-8 rounded-full bg-emerald-100" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
