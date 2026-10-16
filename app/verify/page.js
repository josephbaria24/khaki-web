"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import OnboardingFlow from "@/components/verify/OnboardingFlow";
import TaskerApplicationForm from "@/components/verify/TaskerApplicationForm";
import TeamJoinCard from "@/components/team/TeamJoinCard";
import { useAuth } from "@/lib/AuthContext";
import { canSubmitVerification } from "@/lib/roles";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function VerifyPage() {
  const { user, refresh } = useAuth();
  const [idDocument, setIdDocument] = useState(user?.id_document || null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fullForm, setFullForm] = useState(false);
  const [done, setDone] = useState(user?.verification_status === "pending" || user?.verification_status === "verified");

  if (!canSubmitVerification(user)) {
    return (
      <AppShell>
        <Container className="py-10">
          <h1 className="page-title">Account verification</h1>
          <p className="page-sub">Log in to submit ID verification. One application unlocks Poster and Tasker.</p>
          <Link href="/register" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#163044] px-5 font-bold text-white">Create account</Link>
        </Container>
      </AppShell>
    );
  }

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
      setDone(true);
      toast.success(user?.verification_status === "verified" ? "Sent for review. You can keep using your account." : "Verification submitted");
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
      <div className="landing-page bg-[#F4F7FB] dark:bg-transparent">
        <Container className="max-w-5xl py-8 lg:py-12">
          <OnboardingFlow
            user={user}
            onSubmit={handleSubmit}
            saving={saving}
            error={error}
            done={done && !fullForm}
            onEdit={() => { setDone(false); setFullForm(false); }}
          />
          <TeamJoinCard className="mt-4" />
          <button type="button" onClick={() => setFullForm((value) => !value)} className="mx-auto mt-4 block text-center text-sm font-bold text-[#163044]/60">
            {fullForm ? "Hide the full application" : "Need the full work application?"}
          </button>
          {fullForm ? (
            <div className="mt-4">
              <TaskerApplicationForm
                user={user}
                idDocument={idDocument}
                onIdDocument={setIdDocument}
                error={error}
                saving={saving}
                locked={false}
                submitLabel={user?.verification_status === "verified" ? "Save and send for review" : "Submit application"}
                onSubmit={handleSubmit}
              />
            </div>
          ) : null}
        </Container>
      </div>
    </AppShell>
  );
}
