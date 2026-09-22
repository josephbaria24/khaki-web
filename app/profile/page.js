"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import TaskerProfileCard from "@/components/profile/TaskerProfileCard";
import { useAuth } from "@/lib/AuthContext";
import { LANDING } from "@/lib/landingContent";
import { needsTaskerVerification } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function ProfilePage() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    let live = true;
    Promise.all([
      api.reviews.listByTasker(user.id).catch(() => []),
      api.tasks.list().catch(() => []),
    ]).then(([revs, list]) => {
      if (!live) return;
      setReviews(revs);
      setTasks(list);
    });
    return () => { live = false; };
  }, [user?.id]);

  return (
    <AppShell>
      <div className="landing-page">
        <section className="bg-[#FBF8F1] py-8 lg:py-12">
          <Container>
            <TaskerProfileCard
              profile={user}
              reviews={reviews}
              tasks={tasks}
              isOwn
              showCta={false}
              onSave={async (patch) => {
                await api.profile.update(patch);
                await refresh();
                toast.success("Profile saved");
              }}
            />
            {(user?.role === "admin" || needsTaskerVerification(user) || user?.verification_status === "pending" || user?.id) && (
              <div className="mx-auto mt-4 flex w-full max-w-[420px] flex-wrap justify-center gap-2 md:max-w-[560px] lg:max-w-[640px]">
                {user?.role === "admin" && (
                  <Link href="/admin" className="btn-olive inline-flex h-10 items-center px-5 text-xs">
                    Open admin
                  </Link>
                )}
                {(needsTaskerVerification(user) || user?.verification_status === "pending") && user?.role !== "admin" && (
                  <Link href="/verify" className="btn-olive inline-flex h-10 items-center px-5 text-xs">
                    I-verify ang account
                  </Link>
                )}
                {user?.id ? (
                  <Link href={`/u/${user.id}`} className="inline-flex h-10 items-center rounded-full bg-white px-5 text-xs font-bold shadow-card" style={{ color: LANDING.olive }}>
                    Public link
                  </Link>
                ) : null}
                <Link href="/wallet" className="inline-flex h-10 items-center rounded-full bg-white px-5 text-xs font-bold shadow-card" style={{ color: LANDING.olive }}>
                  Posting fees
                </Link>
              </div>
            )}
          </Container>
        </section>

        <section className="bg-background py-8 lg:py-12">
          <Container>
            <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
              <Link href="/settings" className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[#F3EFE3] text-sm font-bold text-foreground transition hover:bg-[#E8E4D6]">
                Settings
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  toast.success("Logged out");
                  router.push("/");
                }}
                className="h-12 flex-1 rounded-full border-2 border-[#2A3F4D] text-sm font-bold text-[#2A3F4D] transition hover:bg-[#2A3F4D]/10"
              >
                Log out
              </button>
            </div>
          </Container>
        </section>
      </div>
    </AppShell>
  );
}
