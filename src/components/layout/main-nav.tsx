"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function MainNav() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="font-bold text-lg text-slate-800">
            CIE Physics AI
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-100" />
          ) : session ? (
            <Link href="/dashboard">
              <Button size="sm">进入学习</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">免费注册</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
