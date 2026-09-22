"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "@/components/icons";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/lib/AuthContext";
import { homePathFor } from "@/lib/roles";
import { toast } from "@/lib/toast";

export default function LoginPage() {
  const { login, verifySignupOtp, resendSignupOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setNotice("");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Welcome back");
      router.push(homePathFor(user));
    } catch (err) {
      if (err?.code === "otp_required") {
        setOtpEmail(email);
        setOtp("");
        setResendIn(45);
        setNotice("Enter the 6-digit code we emailed you.");
        toast.info("Enter the code we emailed you");
        return;
      }
      const msg = err.message || "Invalid email or password";
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

  if (otpEmail) {
    return (
      <AuthShell
        title="Enter your code"
        subtitle={`We emailed a 6-digit code to ${otpEmail}.`}
        footer={
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setOtpEmail(""); setOtp(""); setError(""); }}>
            Back to login
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
          <button
            type="button"
            disabled={resendIn > 0}
            className="h-11 w-full text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
            onClick={async () => {
              if (resendIn > 0) return;
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
            }}
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Khaki account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">Create one</Link>
        </>
      }
    >
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Email
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="auth-field pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Password
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              className="auth-field pl-10 pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=""
            />
          </div>
        </label>
        <p className="text-right text-xs">
          <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </p>
        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
