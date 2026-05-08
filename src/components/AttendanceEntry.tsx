"use client";

import { useState } from "react";
import { DialPad } from "./DialPad";

const MAX_STUDENT_ID_LEN = 12;

function formatLocalAttendanceTime(d: Date): string {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = d.getMinutes();
  const hh = h.toString().padStart(2, "0");
  const mm = min.toString().padStart(2, "0");
  return `${month}월 ${day}일 ${hh}시 ${mm}분 출석했습니다`;
}

export function AttendanceEntry({
  rosterId,
  studentType,
}: {
  rosterId: string;
  studentType: string;
}) {
  const [studentId, setStudentId] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successTimeLine, setSuccessTimeLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submitAttendance() {
    setError(null);
    setPending(true);
    try {
      const now = new Date();
      const clientDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const res = await fetch("/api/attendance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, rosterId, studentType, clientDateKey }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        if (res.status === 403) {
          setError(data.error ?? "입장 세션이 만료되었습니다. 다시 입장해 주세요.");
        } else {
          setError(data.error ?? "출석 처리에 실패했습니다.");
        }
        return;
      }
      setSuccessMessage(data.message ?? "출석 처리했습니다.");
      setSuccessTimeLine(formatLocalAttendanceTime(new Date()));
      setStudentId("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  function goToStart() {
    setSuccessMessage(null);
    setSuccessTimeLine(null);
    setError(null);
    setStudentId("");
  }

  if (successMessage) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-success-msg"
      >
        <div
          aria-hidden
          className="select-none text-[4.5rem] leading-none sm:text-[5.5rem] md:text-[6.5rem]"
        >
          😍
        </div>
        <div className="mt-8 w-full max-w-md rounded-2xl bg-neutral-100 p-8 sm:p-12">
          <div className="rounded-xl bg-white px-5 py-16 sm:px-7 sm:py-24">
            <p
              id="attendance-success-msg"
              className="whitespace-pre-line text-center text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl md:text-3xl"
            >
              {successMessage}
            </p>
            {successTimeLine ? (
              <p
                className="mt-5 text-center text-base font-semibold leading-relaxed text-muted sm:mt-6 sm:text-lg md:text-xl"
                aria-label={`출석 시각 ${successTimeLine}`}
              >
                {successTimeLine}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-8 w-full max-w-md">
          <div className="rounded-2xl bg-neutral-100 px-10 py-8 sm:px-16 sm:py-10">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={goToStart}
                className="rounded-lg border border-accent bg-white px-10 py-3.5 text-lg font-semibold text-accent shadow-sm transition hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-12 sm:py-4 sm:text-xl"
              >
                처음으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {error && (
        <div
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm leading-relaxed text-red-800 ring-1 ring-red-200"
          role="alert"
        >
          <p>{error}</p>
          <div className="mt-3">
            <button
              type="button"
              onClick={goToStart}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              처음으로
            </button>
          </div>
        </div>
      )}

      <div
        className={`shrink-0 items-center justify-center px-4 ${studentId ? "mb-4 flex min-h-[3.25rem] rounded-xl bg-canvas/70 py-3" : "mb-1 flex min-h-0 py-0"}`}
        aria-live="polite"
        aria-label={studentId ? `입력 중인 학번 ${studentId}` : "학번 입력 대기"}
      >
        {studentId ? (
          <span className="tracking-[0.35em] text-2xl font-semibold tabular-nums text-ink sm:text-[1.65rem]">
            {studentId}
          </span>
        ) : (
          <span className="sr-only">학번을 입력하세요.</span>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-[26rem] flex-col">
        <div className="shrink-0">
          <DialPad
            value={studentId}
            onChange={setStudentId}
            maxLength={MAX_STUDENT_ID_LEN}
          />
        </div>

        <div className="mt-[45px] grid grid-cols-2 gap-3 sm:gap-3">
          <button
            type="button"
            className="inline-flex min-h-[3.25rem] items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 text-lg font-medium text-ink transition-colors hover:bg-neutral-50 sm:min-h-14 sm:px-6"
            onClick={() => {
              setStudentId("");
              setError(null);
            }}
          >
            초기화
          </button>
          <button
            type="button"
            className="inline-flex min-h-[3.25rem] items-center justify-center rounded-lg bg-slate-500 px-5 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:pointer-events-none disabled:opacity-40 sm:min-h-14 sm:px-6"
            disabled={studentId.length === 0 || pending}
            onClick={submitAttendance}
          >
            {pending ? "처리 중..." : "출석 처리"}
          </button>
        </div>
      </div>
    </div>
  );
}
