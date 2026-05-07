import Link from "next/link";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminGatePasswordForm } from "@/components/AdminGatePasswordForm";
import { AdminRosterAttendanceLookup } from "@/components/AdminRosterAttendanceLookup";
import { AdminStudentUpload } from "@/components/AdminStudentUpload";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { readRostersList } from "@/lib/students-store";

export default async function AdminPage() {
  const loggedIn = await isAdminAuthenticated();
  const rosters = loggedIn ? await readRostersList() : [];
  const rosterSummaries = rosters.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updatedAt,
    count: Object.keys(r.students).length,
  }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <main
        className={`w-full rounded-xl border border-edge bg-card p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${loggedIn ? "max-w-2xl" : "max-w-md"}`}
      >
        <h1 className="text-2xl font-bold text-ink">ADMIN SITE</h1>

        {loggedIn ? (
          <>
            <p className="mt-3 text-sm text-muted">
              관리자로 로그인되어 있습니다. 학생 명단을 올린 뒤 출석 화면에서 학번을
              입력하면 이름이 함께 안내됩니다.
            </p>
            <div className="mt-8 flex w-full flex-col gap-12 sm:gap-14 text-left">
              <AdminStudentUpload />
              <AdminRosterAttendanceLookup rosters={rosterSummaries} />
              <AdminGatePasswordForm />
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                <AdminLogoutButton />
                <Link
                  href="/"
                  className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg bg-accent px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover sm:flex-1"
                >
                  출석부로
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted">
              관리자 아이디와 비밀번호로 로그인하세요.
            </p>
            <AdminLoginForm />
          </>
        )}
      </main>
    </div>
  );
}
