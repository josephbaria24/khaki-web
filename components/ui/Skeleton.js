import { cn } from "@/lib/khaki";

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-[#C9D6E0]/55", className)} />;
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 space-y-3 py-2" aria-hidden>
      <Skeleton className="h-12 w-[68%] rounded-2xl" />
      <Skeleton className="ml-auto h-14 w-[58%] rounded-2xl" />
      <Skeleton className="h-10 w-[46%] rounded-2xl" />
      <Skeleton className="ml-auto h-16 w-[72%] rounded-2xl" />
      <Skeleton className="h-12 w-[54%] rounded-2xl" />
    </div>
  );
}

export function NoticeSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-3 h-3 w-16" />
    </div>
  );
}

export function JobSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" aria-hidden>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-5 w-4/5" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}
