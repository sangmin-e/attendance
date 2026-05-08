"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

type RosterSummary = {
  id: string;
  title: string;
  updatedAt: string;
  count: number;
  studentTypes: string[];
};

type AttendanceEntry = {
  id: string;
  studentId: string;
  name: string | null;
  studentType: string | null;
  recordedAt: string;
};

type AttendanceLookupResponse = {
  entries: AttendanceEntry[];
};

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("ko-KR");
}

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "_").trim() || "attendance";
}

export function AdminRosterAttendanceLookup({ rosters }: { rosters: RosterSummary[] }) {
  const [rosterId, setRosterId] = useState(rosters[0]?.id ?? "");
  const [studentType, setStudentType] = useState("");
  const [dateKey, setDateKey] = useState(todayDateKey());
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const hasRosters = rosters.length > 0;
  const selected = useMemo(() => rosters.find((r) => r.id === rosterId), [rosterId, rosters]);
  const selectedTypes = selected?.studentTypes ?? [];
  const typeLabel = studentType || "전체";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rosterId || !dateKey) return;

    setPending(true);
    setError(null);
    try {
      const params = new URLSearchParams({ rosterId, date: dateKey });
      if (studentType) params.set("studentType", studentType);
      const res = await fetch(`/api/admin/attendance/by-date?${params.toString()}`);
      const data = (await res.json()) as AttendanceLookupResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "조회에 실패했습니다.");
        return;
      }
      setEntries(data.entries ?? []);
      setModalOpen(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  function downloadExcel() {
    const rows = entries.map((entry, index) => ({
      번호: index + 1,
      학번: entry.studentId,
      이름: entry.name ?? "",
      유형: entry.studentType ?? "",
      날짜: dateKey,
      출석시간: formatTime(entry.recordedAt),
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "출석조회");
    const fileName = safeFileName(`${selected?.title ?? "출석조회"}_${typeLabel}_${dateKey}.xlsx`);
    XLSX.writeFile(workbook, fileName);
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
              onChange={(e) => {
                setRosterId(e.target.value);
                setStudentType("");
                setEntries([]);
                setModalOpen(false);
              }}
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
            <label className="block text-sm font-medium text-ink" htmlFor="attendance-type">
              유형
            </label>
            <select
              id="attendance-type"
              value={studentType}
              onChange={(e) => setStudentType(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink"
            >
              <option value="">전체</option>
              {selectedTypes.map((type) => (
                <option value={type} key={type}>
                  {type}
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

      {modalOpen && selected ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-result-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl bg-card shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-edge px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 id="attendance-result-title" className="text-xl font-bold text-ink">
                  출석 조회 결과
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {selected.title} / {typeLabel} / {dateKey} / {entries.length}건
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadExcel}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
                  disabled={entries.length === 0}
                >
                  엑셀 저장
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-edge bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-neutral-50"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="overflow-auto px-5 py-4">
              {entries.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted">조회된 출석 데이터가 없습니다.</p>
              ) : (
                <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-edge bg-neutral-50 text-ink">
                      <th className="px-3 py-3 font-semibold">번호</th>
                      <th className="px-3 py-3 font-semibold">학번</th>
                      <th className="px-3 py-3 font-semibold">이름</th>
                      <th className="px-3 py-3 font-semibold">유형</th>
                      <th className="px-3 py-3 font-semibold">출석 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry.id} className="border-b border-edge last:border-b-0">
                        <td className="px-3 py-3 text-muted">{index + 1}</td>
                        <td className="px-3 py-3 font-medium text-ink">{entry.studentId}</td>
                        <td className="px-3 py-3 text-ink">{entry.name ?? ""}</td>
                        <td className="px-3 py-3 text-ink">{entry.studentType ?? ""}</td>
                        <td className="px-3 py-3 text-ink">{formatTime(entry.recordedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
