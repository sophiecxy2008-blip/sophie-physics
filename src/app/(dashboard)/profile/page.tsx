"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Sparkles } from "lucide-react";

const levelOptions = [
  { value: "IGCSE", label: "IGCSE Physics (0625)" },
  { value: "AS_LEVEL", label: "AS-Level Physics (9702)" },
  { value: "A_LEVEL", label: "A-Level Physics (9702)" },
];

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [name, setName] = useState(session?.user?.name || "");
  const [level, setLevel] = useState(session?.user?.level || "IGCSE");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, level }),
      });

      if (res.ok) {
        await update();
        toast("success", "个人资料已更新");
      } else {
        toast("error", "更新失败");
      }
    } catch {
      toast("error", "网络错误");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">个人设置</h1>
        <p className="text-slate-500 mt-1 text-sm">管理你的账号信息</p>
      </div>

      <Card className="border-slate-100">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center text-xl font-bold text-white">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{session?.user?.name}</p>
              <p className="text-sm text-slate-500">{session?.user?.email}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="name">姓名</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="level">课程等级</Label>
            <Select id="level" options={levelOptions} value={level} onChange={(e) => setLevel(e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">
              切换课程等级会影响推荐题目和教学大纲显示
            </p>
          </div>

          <Button className="rounded-xl w-full" onClick={handleSave} disabled={saving}>
            <Sparkles className="h-4 w-4" />
            {saving ? "保存中..." : "保存修改"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
