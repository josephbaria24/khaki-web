"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";
import StarRating from "@/components/StarRating";
import TaskerProfileCard from "@/components/profile/TaskerProfileCard";
import { useAuth } from "@/lib/AuthContext";
import { canOpenPost } from "@/lib/roles";
import { api } from "@/lib/store";

export default function PublicProfilePage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let live = true;
    Promise.all([
      api.profile.get(id),
      api.reviews.listByTasker(id).catch(() => []),
      api.tasks.list().catch(() => []),
    ]).then(([p, revs, list]) => {
      if (!live) return;
      setProfile(p);
      setReviews(revs);
      setTasks(list);
    }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id]);

  const isOwn = Boolean(user?.id && profile?.id && user.id === profile.id);
  const ctaHref = isAuthenticated && canOpenPost(user) ? "/post" : isAuthenticated ? "/browse" : "/register";

  const body = loading ? (
    <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
  ) : !profile ? (
    <p className="p-8 text-center">Hindi mahanap ang profile</p>
  ) : (
    <div className="landing-page">
      <section className="bg-[#FBF8F1] py-8 lg:py-12">
        <Container>
          <TaskerProfileCard
            profile={profile}
            reviews={reviews}
            tasks={tasks}
            isOwn={isOwn}
            ctaHref={ctaHref}
            showCta={!isOwn}
          />
        </Container>
      </section>
      <section className="bg-background py-10">
        <Container className="mx-auto max-w-[420px] space-y-4 md:max-w-[560px] lg:max-w-[720px] xl:max-w-[820px]">
          <h2 className="text-2xl font-black">Feedback</h2>
          {reviews.length === 0 ? (
            <p className="rounded-[1.35rem] border border-dashed py-10 text-center text-sm text-muted-foreground">Walang reviews pa.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-[1.5rem] bg-[#FFFCF7] p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <StarRating value={r.rating} readOnly size="sm" />
                  <span className="text-xs text-muted-foreground">{r.client_name || "Poster"}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment || "Walang comment"}</p>
              </div>
            ))
          )}
          <Link href="/browse" className="btn-olive inline-flex h-11 items-center px-5 text-sm">Back to jobs</Link>
        </Container>
      </section>
    </div>
  );

  if (isAuthenticated) return <AppShell>{body}</AppShell>;
  return <PublicShell>{body}</PublicShell>;
}
