"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg border border-edge bg-card px-8 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas disabled:opacity-60 sm:flex-1"
    >
      {pending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
