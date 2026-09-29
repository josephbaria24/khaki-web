"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import PostedJobsList from "@/components/PostedJobsList";
import TaskCard from "@/components/TaskCard";
import TaskerVehicleSetup from "@/components/TaskerVehicleSetup";
import { JobSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthContext";
import { isPosterMode } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function MyJobsPage() {
  const { user } = useAuth();
  const poster = isPosterMode(user);
  const cached = api.tasks.peek();
  const [tasks, setTasks] = useState(() => cached || []);
  const [ready, setReady] = useState(() => cached != null);
  const [people, setPeople] = useState({});
  const [reviews, setReviews] = useState({});
  const [bidCounts, setBidCounts] = useState({});

  useEffect(() => {
    const stop = api.tasks.subscribeMine((list) => {
      setTasks(list);
      setReady(true);
    });
    return stop;
  }, [user?.active_mode]);

  const posted = tasks.filter((t) => t.client_id === user?.id);
  const working = tasks.filter((t) => t.accepted_tasker_id === user?.id);
  const postedKey = posted.map((t) => t.id).join(",");

  useEffect(() => {
    if (!poster || !postedKey) {
      setBidCounts({});
      return;
    }
    api.offers.countsByTask(postedKey.split(",")).then(setBidCounts).catch(() => setBidCounts({}));
  }, [poster, postedKey]);

  useEffect(() => {
    if (!user || !poster) return;
    const ids = [...new Set(posted.map((t) => t.accepted_tasker_id).filter(Boolean))];
    Promise.all(ids.map((id) => api.profile.get(id).catch(() => null))).then((rows) => {
      const map = {};
      rows.forEach((p) => { if (p) map[p.id] = p; });
      setPeople(map);
    });
    api.reviews.listByReviewer(user.id)
      .then((rows) => {
        const map = {};
        rows.forEach((r) => { map[r.task_id] = r; });
        setReviews(map);
      })
      .catch(() => setReviews({}));
  }, [user, poster, posted.length]);

  const cancelPosted = async (task) => {
    try {
      await api.tasks.cancel(task.id);
      setTasks((prev) => prev.map((row) => (row.id === task.id ? { ...row, status: "cancelled" } : row)));
      toast.success("Gawain cancelled");
    } catch (err) {
      toast.error(err.message || "Could not cancel gawain");
    }
  };

  return (
    <AppShell>
      <Container className="space-y-8 py-6 lg:py-10">
        <div>
          <h1 className="page-title">{poster ? "Aking mga gawain" : "My Jobs"}</h1>
          <p className="page-sub">
            {poster
              ? "Status ng naka-post mo, kung sino'ng kumuha, at ratings after a successful job."
              : "Jobs na tinanggap mo at bids na pending."}
          </p>
        </div>
        {poster ? (
          <section>
            {!ready ? (
              <div className="grid gap-4 md:grid-cols-2">
                <JobSkeleton />
                <JobSkeleton />
                <JobSkeleton />
              </div>
            ) : (
              <>
            <PostedJobsList
              tasks={posted}
              people={people}
              reviews={reviews}
              bidCounts={bidCounts}
              onCancel={cancelPosted}
            />
              </>
            )}
          </section>
        ) : (
          <section className="space-y-8">
            <TaskerVehicleSetup />
            <div>
            <h2 className="mb-4 text-lg font-black">Jobs na tinatapos mo</h2>
            {!ready ? (
              <div className="grid gap-4">
                <JobSkeleton />
                <JobSkeleton />
              </div>
            ) : (
              <>
            <div className="grid gap-4">
              {working.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
            {working.length === 0 && (
              <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                Wala pang accepted job. Maghanap sa browse at sumali sa bidding.
              </p>
            )}
              </>
            )}
            </div>
          </section>
        )}
      </Container>
    </AppShell>
  );
}
