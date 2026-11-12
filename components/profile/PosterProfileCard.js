"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { formatPHP } from "@/lib/khaki";
import { displayName } from "@/lib/taskerProfile";
import { shareVisibility, visiblePostedTasks } from "@/lib/shareVisibility";
import AvatarCropper from "@/components/profile/AvatarCropper";
import ShareProfileDialog from "@/components/profile/ShareProfileDialog";
import { uploadToCloudinary } from "@/lib/uploadFile";
import { toast } from "@/lib/toast";

function CameraBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.2-1.6A1.5 1.5 0 0 1 10.9 4h2.2a1.5 1.5 0 0 1 1.2.4L15.5 6h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}

function sinceLabel(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function taskTone(status) {
  if (status === "released" || status === "completed") return { label: "Completed", className: "text-[#1B6B45] dark:text-[#3DDC97]" };
  if (status === "cancelled") return { label: "Cancelled", className: "text-[#6B6558] dark:text-[#C4CDD6]" };
  return { label: "Open", className: "text-[#1B6B45] dark:text-[#7DCEB0]" };
}

export default function PosterProfileCard({ profile, tasks = [], isOwn = false, onSave }) {
  const [bio, setBio] = useState(profile?.bio || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState("share");
  const photoInputRef = useRef(null);
  const canEditPhoto = Boolean(isOwn && onSave);
  const name = displayName(profile?.full_name) || "Poster";
  const access = shareVisibility(profile);
  const verified = access.verified && profile?.verification_status === "verified";
  const posted = visiblePostedTasks(tasks, profile, { isOwn });
  const open = posted.filter((task) => task.status !== "released" && task.status !== "completed" && task.status !== "cancelled");
  const aboutText = (editing ? bio : profile?.bio || "").trim() || "I post tasks and hire trusted Taskers. I give clear instructions and pay fairly and on time.";
  const about = isOwn || access.about ? aboutText : "";
  const showPhoto = isOwn || access.photo;

  const openShare = (mode) => {
    setShareMode(mode);
    setShareOpen(true);
  };

  const confirmShare = async (next) => {
    setSaving(true);
    try {
      if (onSave) await onSave({ share_visibility: next });
      setShareOpen(false);
      if (shareMode !== "share") return;
      const url = `${window.location.origin}/u/${profile.id}`;
      const text = next.about ? aboutText : `${name} — Poster on Khaki`;
      try {
        if (navigator.share) {
          await navigator.share({ title: `${name} — Poster on Khaki`, text, url });
          return;
        }
      } catch {
        /* clipboard fallback */
      }
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch {
        /* ignore */
      }
    } catch (err) {
      toast.error(err.message || "Could not save what the public can see.");
    } finally {
      setSaving(false);
    }
  };

  const onPhotoPicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onSave) return;
    setPhotoMenu(false);
    setCropFile(file);
  };

  const uploadCropped = async (file) => {
    setPhotoBusy(true);
    try {
      const uploaded = await uploadToCloudinary(file, "khaki/avatars");
      await onSave({ avatar_url: uploaded.url });
      toast.success("Photo updated");
      setCropFile(null);
    } catch (err) {
      toast.error(err.message || "Could not update photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!onSave || !profile?.avatar_url) return;
    if (!window.confirm("Remove your profile photo?")) return;
    setPhotoMenu(false);
    setPhotoBusy(true);
    try {
      await onSave({ avatar_url: null });
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err.message || "Could not remove photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const saveAbout = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({ bio: bio.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="relative mx-auto w-full max-w-[420px] rounded-[1.6rem] bg-white p-5 text-center shadow-card md:max-w-[560px] lg:max-w-[640px] dark:bg-[#1A1E27]">
      {cropFile ? (
        <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={uploadCropped} />
      ) : null}
      <ShareProfileDialog
        open={shareOpen}
        profile={profile}
        saving={saving}
        confirmLabel={shareMode === "share" ? "Share" : "Save"}
        onClose={() => setShareOpen(false)}
        onConfirm={confirmShare}
      />
      <button
        type="button"
        onClick={() => openShare("share")}
        className="absolute right-4 top-4 rounded-full bg-[#E7F1FA] px-3 py-1.5 text-[11px] font-black text-[#163044] dark:bg-[#243445] dark:text-[#E7F1FA]"
      >
        {copied ? "Copied" : "Share"}
      </button>
      <div className="relative mx-auto h-20 w-20">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#D6E6F4] dark:bg-[#1B3044]">
          {showPhoto && profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-[#163044] dark:text-[#E7F1FA]">{name.slice(0, 1)}</span>
          )}
        </div>
        {canEditPhoto ? (
          <>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoPicked} />
            <button
              type="button"
              onClick={() => (profile?.avatar_url ? setPhotoMenu((open) => !open) : photoInputRef.current?.click())}
              disabled={photoBusy}
              className="poster-photo-btn absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(22,48,68,0.28)] disabled:opacity-60"
              aria-label={profile?.avatar_url ? "Change or remove photo" : "Add photo"}
            >
              {photoBusy ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : <CameraBadgeIcon />}
            </button>
            {photoMenu ? (
              <div className="absolute left-1/2 top-[calc(100%+8px)] z-20 w-40 -translate-x-1/2 overflow-hidden rounded-xl bg-white py-1 text-left shadow-card dark:bg-[#24303C]">
                <button type="button" onClick={() => photoInputRef.current?.click()} className="block w-full px-3 py-2.5 text-xs font-bold text-[#163044] hover:bg-[#E7F1FA] dark:text-[#F5F3EE] dark:hover:bg-[#1B3044]">
                  Change photo
                </button>
                <button type="button" onClick={removePhoto} className="block w-full px-3 py-2.5 text-xs font-bold text-[#C94B78] hover:bg-[#F8D5E0]/70">
                  Remove photo
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <h1 className="mt-3 text-2xl font-black text-[#163044] dark:text-[#F5F3EE]">{name}</h1>
      <p className="mt-1 text-sm font-bold text-[#1B6B45] dark:text-[#3DDC97]">
        Poster{verified ? " · Verified Poster" : ""}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-[#5F6B76] dark:text-[#A8B3C0]">
        {sinceLabel(profile?.created_at) ? `Poster since ${sinceLabel(profile.created_at)}` : "Poster"}
        {(isOwn || access.location) && profile?.location_area ? ` · Active in ${profile.location_area}` : ""}
      </p>
      {isOwn ? (
        <button type="button" onClick={() => openShare("edit")} className="mt-3 text-[11px] font-black text-[#3E7498] dark:text-[#8EC4E8]">
          Public access
        </button>
      ) : null}

      {about || editing ? (
      <section className="mt-6 text-left">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">About</h2>
          {isOwn && onSave ? (
            <button type="button" onClick={() => (editing ? saveAbout() : setEditing(true))} className="text-[11px] font-black text-[#3E7498] dark:text-[#8EC4E8]">
              {saving ? "Saving" : editing ? "Save" : "Edit"}
            </button>
          ) : null}
        </div>
        {editing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-2 min-h-24 w-full rounded-2xl bg-[#E7F1FA] p-3 text-sm text-[#163044] outline-none dark:bg-[#1B3044] dark:text-[#F5F3EE]"
          />
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-[#2A3F4D] dark:text-[#E7EEF4]">{about}</p>
        )}
      </section>
      ) : null}

      <section className="mt-6 text-left">
        <h2 className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">My posted tasks</h2>
        {posted.length === 0 ? (
          <p className="mt-2 text-sm text-[#5F6B76] dark:text-[#A8B3C0]">No posted tasks yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {posted.slice(0, 8).map((task) => {
              const tone = taskTone(task.status);
              return (
                <li key={task.id}>
                  <Link href={`/task/${task.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-[#F4F7FA] px-3 py-2.5 transition hover:bg-[#E7F1FA] dark:bg-[#24303C] dark:hover:bg-[#1B3044]">
                    <span className="min-w-0 truncate text-sm font-bold text-[#163044] dark:text-[#F5F3EE]">{task.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-[#5F6B76] dark:text-[#C5D0DA]">
                      <span className="money">{formatPHP(task.budget_php)}</span>
                      {" · "}
                      <span className={`font-black ${tone.className}`}>{tone.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isOwn || access.history ? (
      <section className="mt-6">
        <h2 className="text-sm font-black text-[#163044] dark:text-[#F5F3EE]">Posted tasks history</h2>
        <p className="mt-2 text-sm text-[#5F6B76] dark:text-[#A8B3C0]">
          {posted.length} posted · {open.length} open
        </p>
      </section>
      ) : null}
    </article>
  );
}
