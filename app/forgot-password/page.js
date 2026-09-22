"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await api.auth.resetPassword(email);
      setNotice("If that email exists, a reset link is on its way.");
      toast.success("Reset link sent if that email exists");
    } catch (err) {
      const msg = err.message || "Could not send reset link";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a link to choose a new password.">
      {error && <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p className="mb-3 rounded-lg bg-accent/10 p-3 text-sm text-foreground">{notice}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="auth-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <Link href="/login" className="mt-6 flex h-12 items-center justify-center rounded-xl border border-input bg-background font-bold text-foreground">
        Back to login
      </Link>
    </AuthShell>
  );
}
