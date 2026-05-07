import { Suspense } from "react";
import Link from "next/link";
import { GateUnlockForm } from "@/components/GateUnlockForm";

export default function UnlockPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <main className="w-full max-w-md rounded-xl border border-edge bg-card p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h1 className="text-2xl font-bold text-ink">출석 화면 입장</h1>
        <p className="mt-3 text-sm text-muted">
          출석체크를 사용하려면 비밀번호를 입력하세요.
        </p>
        <Suspense fallback={<p className="mt-6 text-sm text-muted">불러오는 중…</p>}>
          <GateUnlockForm />
        </Suspense>
        <p className="mt-8 text-xs text-muted">
          <Link href="/admin" className="underline underline-offset-2">
            관리자 페이지
          </Link>
        </p>
      </main>
    </div>
  );
}
