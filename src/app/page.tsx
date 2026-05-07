import Link from "next/link";
import { redirect } from "next/navigation";
import { AttendanceEntry } from "@/components/AttendanceEntry";
import { isGateUnlocked } from "@/lib/auth-helpers";

export default async function Home() {
  if (!(await isGateUnlocked())) {
    redirect("/unlock?next=/");
  }

  return (
    <div className="relative flex min-h-screen flex-1 justify-center px-4 py-4 sm:px-6 sm:py-6">
      <main className="flex w-full max-w-lg flex-col gap-4">
        <header className="mt-1 text-center sm:mt-2">
          <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight text-ink sm:text-3xl">
            😎 출석체크
          </h1>
          <p className="mt-3 text-lg font-normal text-ink sm:text-xl">
            학번을 입력하세요.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
            예) 1학년 5반 15번 이라면 → 10515
          </p>
        </header>

        <section
          className="flex flex-col rounded-xl border border-edge bg-card px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6 sm:py-6"
          aria-label="출석 입력 영역"
        >
          <AttendanceEntry />
        </section>
      </main>
      <p className="pointer-events-auto fixed bottom-5 right-6 text-[0.67rem] font-bold text-sky-400 sm:bottom-6 sm:right-8 sm:text-[0.75rem]">
        Developed by sangmin |{" "}
        <Link href="/admin" className="underline underline-offset-2">
          ADMIN SITE
        </Link>
      </p>
    </div>
  );
}
