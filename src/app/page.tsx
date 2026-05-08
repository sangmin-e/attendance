import Link from "next/link";
import { redirect } from "next/navigation";
import { AttendanceClassSession } from "@/components/AttendanceClassSession";
import { isGateUnlocked } from "@/lib/auth-helpers";
import { readRostersList } from "@/lib/students-store";

export default async function Home() {
  if (!(await isGateUnlocked())) {
    redirect("/unlock?next=/");
  }

  const rosters = await readRostersList();
  const classOptions = rosters.flatMap((roster) => {
    const students = roster.students;
    const types = Array.from(
      new Set(students.map((student) => student.studentType).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "ko-KR"));

    if (types.length === 0) {
      return [
        {
          id: roster.id,
          rosterId: roster.id,
          title: roster.title,
          studentType: "",
          count: students.length,
        },
      ];
    }

    return types.map((type) => ({
      id: `${roster.id}:${type}`,
      rosterId: roster.id,
      title: type,
      studentType: type,
      count: students.filter((student) => student.studentType === type).length,
    }));
  });

  return (
    <div className="relative flex min-h-screen flex-1 justify-center px-4 py-4 sm:px-6 sm:py-6">
      <main className="flex w-full max-w-lg flex-col gap-4">
        <AttendanceClassSession classes={classOptions} />
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
