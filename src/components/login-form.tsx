"use client";

import { Brain, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export function LoginForm({ next }: { next: string }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Login gagal");
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
          <Brain className="size-5 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-white">
            Story <span className="font-serif font-medium italic text-cyan-200">Maker</span>
          </h1>
          <p className="text-xs text-slate-400">Dashboard terkunci passcode</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="passcode">Passcode</Label>
          <Input id="passcode" type="password" autoFocus autoComplete="current-password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
        </div>
        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
        <Button type="submit" variant="primary" className="w-full" loading={loading} disabled={!passcode}>
          {loading ? null : <Lock />} Masuk
        </Button>
      </form>
    </Card>
  );
}
