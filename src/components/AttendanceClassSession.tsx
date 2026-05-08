"use client";

import { useEffect, useMemo, useState } from "react";
import { AttendanceEntry } from "./AttendanceEntry";

const SESSION_CLASS_KEY = "attendance:selectedClass";
const SESSION_GATE_KEY = "attendance:gateUnlocked";

type ClassOption = {
  id: string;
  rosterId: string;
  title: string;
  studentType: string;
  count: number;
};

export function AttendanceClassSession({ classes }: { classes: ClassOption[] }) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(SESSION_GATE_KEY) !== "1") {
      window.sessionStorage.removeItem(SESSION_CLASS_KEY);
      window.location.replace("/unlock?next=/");
      return;
    }

    const stored = window.sessionStorage.getItem(SESSION_CLASS_KEY);
    const exists = classes.some((item) => item.id === stored);
    if (stored && exists) {
      setSelectedClassId(stored);
    } else {
      window.sessionStorage.removeItem(SESSION_CLASS_KEY);
    }
    setReady(true);
  }, [classes]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  function selectClass(classId: string) {
    window.sessionStorage.setItem(SESSION_CLASS_KEY, classId);
    setSelectedClassId(classId);
  }

  if (!ready) {
    return (
      <section className="rounded-xl border border-edge bg-card px-5 py-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6">
        <p className="text-sm text-muted">수업 목록을 불러오는 중입니다.</p>
      </section>
    );
  }

  if (classes.length === 0) {
    return (
      <section className="rounded-xl border border-edge bg-card px-5 py-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6">
        <h1 className="text-2xl font-bold text-ink">출석체크</h1>
        <p className="mt-3 text-sm text-muted">등록된 명단이 없습니다. 관리자에서 명단을 먼저 업로드하세요.</p>
      </section>
    );
  }

  if (!selectedClass) {
    return (
      <section className="rounded-xl border border-edge bg-card px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6">
        <header className="text-center">
          <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight text-ink sm:text-3xl">
            출석체크
          </h1>
          <p className="mt-3 text-base text-muted sm:text-lg">수업을 선택하세요.</p>
        </header>

        <div className="mt-6 grid gap-3">
          {classes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectClass(item.id)}
              className="flex min-h-16 w-full items-center justify-between rounded-lg border border-edge bg-white px-5 py-4 text-left transition hover:border-accent hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="text-lg font-semibold text-ink">{item.title}</span>
              <span className="text-sm font-medium text-muted">{item.count}명</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <header className="mt-1 text-center sm:mt-2">
        <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight text-ink sm:text-3xl">
          {selectedClass.title} 출석체크
        </h1>
        <p className="mt-3 text-lg font-normal text-ink sm:text-xl">
          학번을 입력하세요.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
          예: 1학년 5반 15번이라면 10515
        </p>
      </header>

      <section
        className="flex flex-col rounded-xl border border-edge bg-card px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6 sm:py-6"
        aria-label="출석 입력 영역"
      >
        <AttendanceEntry
          rosterId={selectedClass.rosterId}
          studentType={selectedClass.studentType}
        />
      </section>
    </>
  );
}
