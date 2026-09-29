"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "@/components/icons";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/lib/AuthContext";
import { homePathFor } from "@/lib/roles";
import { toast } from "@/lib/toast";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Welcome back");
      router.push(homePathFor(user));
    } catch (err) {
      const msg = err.message || "Invalid email or password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
            <Mail className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="auth-field pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Password
          <div className="mt-1">
            <PasswordInput
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
