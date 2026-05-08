"use client";

import { useState } from "react";

type RosterSummary = {
  id: string;
  title: string;
  count: number;
};

export function AdminRosterDelete({ rosters }: { rosters: RosterSummary[] }) {
  const [rosterId, setRosterId] = useState(rosters[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = rosters.find((r) => r.id === rosterId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("삭제할 명단을 선택하세요.");
      return;
    }

    const ok = window.confirm(
      `"${selected.title}" 명단과 해당 출석 데이터를 전체 삭제할까요?`,
    );
    if (!ok) return;

    setPending(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/students/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rosterId: selected.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      setStatus("삭제했습니다.");
      window.location.reload();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-t border-edge pt-8 text-left">
      <h2 className="text-lg font-semibold text-ink">명단 삭제</h2>
      {rosters.length === 0 ? (
        <p className="mt-2 text-sm text-muted">삭제할 학생 명단이 없습니다.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="delete-roster-select" className="block text-sm font-medium text-ink">
              명단 이름
            </label>
            <select
              id="delete-roster-select"
              value={rosterId}
              onChange={(e) => setRosterId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink"
            >
              {rosters.map((r) => (
                <option value={r.id} key={r.id}>
                  {r.title} ({r.count}명)
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            {pending ? "삭제 중..." : "선택한 명단 전체 삭제"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {status ? <p className="text-sm text-accent">{status}</p> : null}
        </form>
      )}
    </section>
  );
}
