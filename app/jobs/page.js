"use client";

import { useEffect, useState } from "react";
import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";
import { formatPHP } from "@/lib/khaki";
import { api } from "@/lib/store";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    api.jobs.list().then(setJobs).catch(() => setJobs([]));
  }, []);

  return (
    <PublicShell>
      <Container className="py-10 lg:py-14">
        <h1 className="page-title">Jobs board</h1>
        <p className="page-sub">Longer-term hiring and looking-for-work posts across Palawan.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{job.post_type === "looking_for_work" ? "Looking for work" : "Hiring"}</p>
              <h2 className="mt-1 text-lg font-black">{job.job_title}</h2>
              <p className="text-sm text-muted-foreground">{job.company_name} · {job.location_area}</p>
              <p className="mt-2 text-sm leading-relaxed">{job.description}</p>
              <p className="mt-3 font-bold text-primary">{formatPHP(job.salary_min)}–{formatPHP(job.salary_max)} / {job.salary_period}</p>
            </article>
          ))}
          {jobs.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No job posts yet.</p>
          )}
        </div>
      </Container>
    </PublicShell>
  );
}
