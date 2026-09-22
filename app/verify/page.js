"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import TaskerApplicationForm from "@/components/verify/TaskerApplicationForm";
import VerificationStatusBanner from "@/components/verify/VerificationStatusBanner";
import { useAuth } from "@/lib/AuthContext";
import { canSubmitVerification } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function VerifyPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [idDocument, setIdDocument] = useState(user?.id_document || null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!canSubmitVerification(user)) {
    return (
      <AppShell>
        <Container className="py-10">
          <h1 className="page-title">Account verification</h1>
          <p className="page-sub">Log in to submit ID verification. One application unlocks Poster and Tasker.</p>
          <Link href="/dashboard" className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-bold text-white">Go to dashboard</Link>
        </Container>
      </AppShell>
    );
  }

  const status = user.verification_status;
  const locked = status === "pending" || status === "verified";

  const handleSubmit = async (err, payload) => {
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await api.verification.submit(payload);
      await refresh();
      toast.success("Verification submitted");
    } catch (e) {
      const msg = e.message || "Could not submit verification";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="landing-page bg-[#FBF8F1]">
        <Container className="max-w-[720px] py-8 lg:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D666A]">Join Palawan’s workforce</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Account verification</h1>
          <VerificationStatusBanner user={user} />
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            I-submit ang government ID once. After admin approval, same account can post gawain (Poster) and accept jobs (Tasker).
          </p>

          <div className="mt-6">
            <TaskerApplicationForm
              user={user}
              idDocument={idDocument}
              onIdDocument={setIdDocument}
              error={error}
              saving={saving}
              locked={locked}
              onSubmit={handleSubmit}
            />
          </div>

          {status === "verified" ? (
            <button onClick={() => router.push("/browse")} className="btn-olive mt-5 inline-flex h-11 items-center px-5 text-sm">
              Maghanap ng gawain
            </button>
          ) : (
            <Link href="/dashboard" className="mt-5 inline-block text-sm font-bold text-[#0D666A]">
              Continue to dashboard
            </Link>
          )}
        </Container>
      </div>
    </AppShell>
  );
}
