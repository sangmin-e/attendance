"use client";

import { useState } from "react";

export function AdminStudentUpload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("엑셀 파일을 선택하세요.");
      return;
    }

    setPending(true);
    setError(null);
    setStatus(null);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("file", file);

      const res = await fetch("/api/admin/students/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { error?: string; count?: number };
      if (!res.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      setStatus(`학생 ${data.count ?? 0}명을 저장했습니다.`);
      setFile(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-t border-edge pt-8 text-left">
      <h2 className="text-lg font-semibold text-ink">학생 명단 업로드</h2>
      <p className="mt-2 text-sm text-muted">학번/이름 엑셀 파일을 업로드하세요.</p>
      <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
        <div>
          <label htmlFor="roster-title" className="block text-sm font-medium text-ink">
            명단 이름
          </label>
          <input
            id="roster-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink"
            placeholder="예: 1기 주제선택"
          />
        </div>
        <div>
          <label htmlFor="roster-file" className="block text-sm font-medium text-ink">
            엑셀 파일(.xlsx)
          </label>
          <input
            id="roster-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1.5 w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-ink"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {status ? <p className="text-sm text-accent">{status}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "업로드 중..." : "업로드"}
        </button>
      </form>
    </section>
  );
}
