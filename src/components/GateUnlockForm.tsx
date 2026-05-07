"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function GateUnlockForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/gate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "입장에 실패했습니다.");
        return;
      }
      const dest = nextPath.startsWith("/") ? nextPath : "/";
      router.push(dest);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4 text-left">
      <div>
        <label htmlFor="gate-pass" className="block text-sm font-medium text-ink">
          출석 화면 비밀번호
        </label>
        <input
          id="gate-pass"
          name="password"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "확인 중…" : "입장"}
      </button>
    </form>
  );
}
