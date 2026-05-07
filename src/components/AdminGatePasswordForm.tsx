"use client";

import { useState } from "react";

export function AdminGatePasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/gate-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, passwordConfirm }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setStatus("출석부 입장 비밀번호를 저장했습니다.");
      setPassword("");
      setPasswordConfirm("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-t border-edge pt-8 text-left">
      <h2 className="text-lg font-semibold text-ink">출석부 입장 비밀번호</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        출석부 화면에 처음 들어갈 때 입력하는 비밀번호입니다. 저장하면 즉시 적용되며,
        이후에는 새 비밀번호로만 입장할 수 있습니다.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <div>
          <label htmlFor="gate-new" className="block text-sm font-medium text-ink">
            새 비밀번호
          </label>
          <input
            id="gate-new"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
            minLength={4}
            maxLength={64}
            required
          />
        </div>
        <div>
          <label htmlFor="gate-new2" className="block text-sm font-medium text-ink">
            새 비밀번호 확인
          </label>
          <input
            id="gate-new2"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
            minLength={4}
            maxLength={64}
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {status ? <p className="text-sm text-accent">{status}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "저장 중…" : "비밀번호 저장"}
        </button>
      </form>
    </section>
  );
}
