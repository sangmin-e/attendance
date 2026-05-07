"use client";

import { useMemo, useState } from "react";

type RosterSummary = {
  id: string;
  title: string;
  updatedAt: string;
  count: number;
};

type AttendanceLookupResponse = {
  entries: Array<{
    id: string;
    studentId: string;
    name: string | null;
    recordedAt: string;
  }>;
};

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AdminRosterAttendanceLookup({ rosters }: { rosters: RosterSummary[] }) {
  const [rosterId, setRosterId] = useState(rosters[0]?.id ?? "");
  const [dateKey, setDateKey] = useState(todayDateKey());
  const [entries, setEntries] = useState<AttendanceLookupResponse["entries"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasRosters = rosters.length > 0;
  const selected = useMemo(() => rosters.find((r) => r.id === rosterId), [rosterId, rosters]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rosterId || !dateKey) return;

    setPending(true);
    setError(null);
    try {
      const params = new URLSearchParams({ rosterId, date: dateKey });
      const res = await fetch(`/api/admin/attendance/by-date?${params.toString()}`);
      const data = (await res.json()) as AttendanceLookupResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "조회에 실패했습니다.");
        return;
      }
      setEntries(data.entries ?? []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-t border-edge pt-8 text-left">
      <h2 className="text-lg font-semibold text-ink">출석 조회</h2>
      {!hasRosters ? (
        <p className="mt-2 text-sm text-muted">등록된 학생 명단이 없습니다.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="roster-select">
              명단
            </label>
            <select
              id="roster-select"
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
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="attendance-date">
              날짜
            </label>
            <input
              id="attendance-date"
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "조회 중..." : "조회"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      )}

      {selected ? (
        <div className="mt-5 rounded-lg border border-edge p-3 text-sm text-ink">
          <p className="font-medium">{selected.title}</p>
          <p className="mt-2 text-muted">조회 결과: {entries.length}건</p>
          <ul className="mt-3 space-y-1">
            {entries.map((e) => (
              <li key={e.id}>
                {e.studentId} {e.name ?? ""} ({new Date(e.recordedAt).toLocaleTimeString("ko-KR")})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
