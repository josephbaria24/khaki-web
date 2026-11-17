"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, CircleAlert } from "@/components/icons";
import AppShell from "@/components/AppShell";
import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";
import TaskFlowView from "@/components/task-flow/TaskFlowView";
import { Button, Card, Field, inputClass } from "@/components/task-flow/parts";
import { useAuth } from "@/lib/AuthContext";
import { LOCATIONS, SCHEDULE_LABELS, SERVICE_CATEGORIES, displayTaskCategory, formatPHP, scheduleLabel, serviceByKey, serviceForTaskCategory, skillFitsTask, skillSummary } from "@/lib/khaki";
import { publicCanOpenTask, taskShareGroup } from "@/lib/shareVisibility";
import { isTaskerMode } from "@/lib/roles";
import { api } from "@/lib/store";
import { DEFAULT_FLOW_SETTINGS, cleanPriceRange, priceRange } from "@/lib/taskFlow";
import { toast } from "@/lib/toast";
import { PageSkeleton } from "@/components/ui/Skeleton";

function TaskShell({ children }) {
  const { ready, isAuthenticated } = useAuth();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#11141A]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9D6E0] border-t-[#163044]" />
      </div>
    );
  }
  if (isAuthenticated) return <AppShell>{children}</AppShell>;
  return <PublicShell>{children}</PublicShell>;
}

function editDraft(task) {
  const range = priceRange(task);
  return {
    title: task.title,
    details: task.details || "",
    category: task.category,
    location_area: task.location_area,
    barangay: task.barangay || "",
    location_detail: task.location_detail || "",
    is_remote: Boolean(task.is_remote),
    schedule_type: task.schedule_type || "flexible",
    schedule_date: task.schedule_date || "",
    budget_php: task.budget_php,
    range_min: range.flexible ? range.min : "",
    range_max: range.flexible ? range.max : "",
  };
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [tick, setTick] = useState(0);
  const [task, setTask] = useState(null);
  const [offers, setOffers] = useState([]);
  const [hold, setHold] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_FLOW_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({});
  const [poster, setPoster] = useState(null);
  const [tasker, setTasker] = useState(null);
  const [bidders, setBidders] = useState({});
  const [bidderRatings, setBidderRatings] = useState({});
  const [review, setReview] = useState(null);
  const [clientReview, setClientReview] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    api.flow.settings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let live = true;
    Promise.all([
      api.tasks.get(id),
      api.offers.listByTask(id),
      api.reviews.getByTask(id).catch(() => null),
      api.flow.clientReview(id).catch(() => null),
      api.reports.mineForTask(id),
      api.escrow.forTask(id).catch(() => null),
    ])
      .then(([t, o, r, cr, reports, h]) => {
        if (!live) return;
        setTask(t);
        setOffers(o);
        setReview(r);
        setClientReview(cr);
        setMyReports(reports || []);
        setHold(h);
        if (t) setEdit(editDraft(t));
      })
      .catch(() => {
        if (live) setTask(null);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id, tick]);

  useEffect(() => {
    if (!task?.client_id) return;
    api.profile.get(task.client_id).then(setPoster).catch(() => setPoster(null));
  }, [task?.client_id]);

  useEffect(() => {
    if (!task?.accepted_tasker_id) {
      setTasker(null);
      return;
    }
    api.profile.get(task.accepted_tasker_id).then(setTasker).catch(() => setTasker(null));
  }, [task?.accepted_tasker_id]);

  useEffect(() => {
    const ids = [...new Set(offers.map((o) => o.tasker_id))];
    if (!ids.length) {
      setBidders({});
      setBidderRatings({});
      return;
    }
    api.profile.getMany(ids).then(setBidders).catch(() => setBidders({}));
    Promise.all(ids.map((bidId) => api.reviews.listByTasker(bidId).catch(() => []))).then((lists) => {
      const map = {};
      ids.forEach((bidId, i) => {
        const rows = lists[i] || [];
        map[bidId] = rows.length
          ? { avg: rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length, count: rows.length }
          : null;
      });
      setBidderRatings(map);
    });
  }, [offers]);

  if (loading) {
    return (
      <TaskShell>
        <Container className="py-8">
          <PageSkeleton rows={4} />
        </Container>
      </TaskShell>
    );
  }

  if (!task) {
    return (
      <TaskShell>
        <p className="p-8 text-center text-[#163044] dark:text-[#F5F3EE]">Hindi mahanap ang gawain</p>
      </TaskShell>
    );
  }

  const isClient = user?.id === task.client_id;
  const categoryName = displayTaskCategory(task);
  const taskPrivate = Boolean(poster) && !isClient && !publicCanOpenTask(poster, task.status);

  if (taskPrivate) {
    return (
      <TaskShell>
        <Container className="max-w-lg py-10">
          <h1 className="text-2xl font-black text-[#163044] dark:text-[#F5F3EE]">This task is private</h1>
          <p className="mt-2 text-sm font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
            The poster turned off public access for {taskShareGroup(task.status)} tasks.
          </p>
          <Link href={`/u/${task.client_id}`} className="mt-5 inline-flex h-11 items-center rounded-full bg-[#163044] px-5 text-sm font-black text-[#F7F4EC] dark:bg-[#F5F3EE] dark:text-[#11141A]">
            View profile
          </Link>
        </Container>
      </TaskShell>
    );
  }

  const lockedOut = !isClient && isTaskerMode(user) && task.status === "open" && !skillFitsTask(user?.skills, task);

  if (lockedOut) {
    const meta = [scheduleLabel(task), formatPHP(task.budget_php), task.is_remote ? "Remote" : task.location_area].filter(Boolean).join(" · ");
    const registered = skillSummary(user?.skills);
    return (
      <TaskShell>
        <Container className="max-w-lg py-5 lg:max-w-xl lg:py-8">
          <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-xs font-black text-[#5F6B76] hover:text-[#163044] dark:text-[#A8B3C0]">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <Card>
            <p className="text-[11px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">{categoryName}</p>
            <h1 className="mt-1 text-xl font-black leading-tight text-[#163044] dark:text-[#F5F3EE]">{task.title}</h1>
            <p className="mt-1 text-[12px] font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">{meta}</p>
          </Card>
          <div className="mt-3 rounded-[1.25rem] border border-[#F3D9A4] bg-[#FFF8EA] p-4 dark:border-[#4A3A1A] dark:bg-[#2A2214]">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" color="#8A5A12" />
              <div className="min-w-0">
                <h2 className="text-base font-black leading-tight text-[#8A5A12] dark:text-[#F2C46D]">Not qualified for {categoryName}</h2>
                <p className="mt-1 text-[13px] font-semibold leading-snug text-[#8A5A12]/80 dark:text-[#F2C46D]/80">
                  {registered
                    ? `You are registered for ${registered}. You cannot accept ${categoryName}.`
                    : "Add a skill on your profile. You can only book gawain that match it."}
                </p>
              </div>
            </div>
          </div>
          {task.details ? <p className="mt-4 text-sm font-medium leading-relaxed text-[#2A3F4D]/70 dark:text-[#A8B3C0]">{task.details}</p> : null}
        </Container>
      </TaskShell>
    );
  }

  const bidAccepted = Boolean(task.accepted_tasker_id) || offers.some((o) => o.status === "accepted");
  const canEdit = isClient && task.status === "open" && !bidAccepted;

  const saveEdit = async (e) => {
    e.preventDefault();
    const range = cleanPriceRange({ min: edit.range_min, max: edit.range_max }, edit.budget_php);
    if (range?.error) {
      toast.error(range.error);
      return;
    }
    try {
      await api.tasks.update(task.id, { ...edit, price_range: range?.range || null });
      setEditing(false);
      refresh();
      toast.success("Task updated");
    } catch (err) {
      toast.error(err.message || "Could not save changes");
    }
  };

  const set = (key, value) => setEdit((current) => ({ ...current, [key]: value }));

  const editForm = (
    <Card>
      <form onSubmit={saveEdit} className="space-y-3">
        <h2 className="text-base font-black text-[#163044] dark:text-[#F5F3EE]">Edit task</h2>
        <Field label="Title">
          <input className={inputClass} value={edit.title || ""} onChange={(e) => set("title", e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Category">
            <select
              className={inputClass}
              value={(serviceForTaskCategory(edit.category) || SERVICE_CATEGORIES[0]).key}
              onChange={(e) => set("category", serviceByKey(e.target.value).enumValue)}
            >
              {SERVICE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
            </select>
          </Field>
          <Field label="Schedule">
            <select className={inputClass} value={edit.schedule_type} onChange={(e) => set("schedule_type", e.target.value)}>
              {Object.entries(SCHEDULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#163044] dark:text-[#F5F3EE]">
          <input type="checkbox" checked={Boolean(edit.is_remote)} onChange={(e) => set("is_remote", e.target.checked)} />
          Remote
        </label>
        {!edit.is_remote ? (
          <Field label="Town">
            <select className={inputClass} value={edit.location_area} onChange={(e) => set("location_area", e.target.value)}>
              {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label="Details">
          <textarea className={`${inputClass} h-24 py-2`} value={edit.details || ""} onChange={(e) => set("details", e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Fixed price">
            <input className={inputClass} type="number" min={15} value={edit.budget_php} onChange={(e) => set("budget_php", e.target.value)} />
          </Field>
          <Field label="Range from">
            <input className={inputClass} type="number" min={15} value={edit.range_min} placeholder="—" onChange={(e) => set("range_min", e.target.value)} />
          </Field>
          <Field label="Range to">
            <input className={inputClass} type="number" min={15} value={edit.range_max} placeholder="—" onChange={(e) => set("range_max", e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" onClick={() => setEditing(false)}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Card>
  );

  return (
    <TaskShell>
      <Container>
        <TaskFlowView
          task={task}
          setTask={setTask}
          offers={offers}
          hold={hold}
          settings={settings}
          user={user}
          isAuthenticated={isAuthenticated}
          poster={poster}
          tasker={tasker}
          bidders={bidders}
          bidderRatings={bidderRatings}
          review={review}
          clientReview={clientReview}
          myReports={myReports}
          refresh={refresh}
          canEdit={canEdit}
          editing={editing}
          onToggleEdit={() => setEditing((v) => !v)}
          editForm={editForm}
        />
      </Container>
    </TaskShell>
  );
}
