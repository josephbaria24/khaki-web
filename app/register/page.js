"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "@/components/icons";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/lib/AuthContext";
import { homePathFor } from "@/lib/roles";
import { toast } from "@/lib/toast";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { register, verifySignupOtp, resendSignupOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState(searchParams.get("role") === "tasker" ? "tasker" : "poster");
  const [posterType, setPosterType] = useState("individual");
  const [companyName, setCompanyName] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    if (!age) {
      setError("You must confirm that you are at least 18");
      toast.error("Confirm that you are at least 18");
      return;
    }
    if (!terms) {
      setError("You must accept the Terms and Privacy Policy");
      toast.error("Accept the Terms and Privacy Policy");
      return;
    }
    if (role === "poster" && posterType === "company" && !companyName.trim()) {
      setError("Company name is required");
      toast.error("Company name is required");
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        email,
        password,
        full_name: fullName,
        role,
        poster_type: posterType,
        company_name: companyName,
      });
      if (user?.needsOtp) {
        setOtpEmail(user.email);
        setOtp("");
        setResendIn(45);
        setNotice(`We sent a 6-digit code to ${user.email}.`);
        toast.info("Check your email for a code");
        return;
      }
      toast.success("Account created");
      router.push(homePathFor(user));
    } catch (err) {
      const msg = err.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const user = await verifySignupOtp(otpEmail, otp);
      toast.success("Account verified");
      router.push(homePathFor(user));
    } catch (err) {
      const msg = err.message || "Invalid code";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendIn > 0) return;
    setError("");
    try {
      await resendSignupOtp(otpEmail);
      setResendIn(45);
      setNotice("A new code is on its way.");
      toast.success("Code resent");
    } catch (err) {
      const msg = err.message || "Could not resend code";
      setError(msg);
      toast.error(msg);
    }
  };

  if (otpEmail) {
    return (
      <AuthShell
        title="Enter your code"
        subtitle={`We emailed a 6-digit code to ${otpEmail}.`}
        footer={
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setOtpEmail(""); setOtp(""); setError(""); }}>
            Use a different email
          </button>
        }
      >
        {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {notice && <p className="mb-4 rounded-lg bg-accent/10 p-3 text-sm text-accent">{notice}</p>}
        <form onSubmit={onVerify} className="space-y-3">
          <input
            className="auth-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          <button disabled={loading || otp.length !== 6} className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify code"}
          </button>
          <button type="button" onClick={onResend} disabled={resendIn > 0} className="h-11 w-full text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60">
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
        subtitle="One account, two modes — Poster at Tasker. Verification unlocks posting and bidding."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </>
      }
    >
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("poster")}
            className={`rounded-xl border px-3 py-3 text-left text-sm text-foreground ${role === "poster" ? "border-primary bg-primary/10 font-bold" : "border-input bg-background"}`}
          >
            Poster
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Start by posting. I-toggle to Tasker anytime — one account.</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("tasker")}
            className={`rounded-xl border px-3 py-3 text-left text-sm text-foreground ${role === "tasker" ? "border-primary bg-primary/10 font-bold" : "border-input bg-background"}`}
          >
            Tasker
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Start by finding jobs. I-toggle to Poster anytime — one account.</span>
          </button>
        </div>
        {role === "poster" && (
          <div className="space-y-2 rounded-xl bg-muted/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Poster type</p>
            <div className="flex gap-3 text-sm text-foreground">
              <label className="flex items-center gap-2">
                <input type="radio" name="poster_type" checked={posterType === "individual"} onChange={() => setPosterType("individual")} />
                Individual
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="poster_type" checked={posterType === "company"} onChange={() => setPosterType("company")} />
                Company
              </label>
            </div>
            {posterType === "company" && (
              <input className="auth-field h-11" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            )}
          </div>
        )}
        <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          After signup, i-submit ang government ID once. Admin verifies it before you can post or accept gawain. Same account, both modes.
        </p>
        <input className="auth-field" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input className="auth-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        <PasswordInput placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-0.5" />
          I am at least 18 years old
        </label>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5" />
          I accept the <Link href="/terms" className="text-primary">Terms</Link> and <Link href="/privacy" className="text-primary">Privacy Policy</Link>
        </label>
        <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
