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
      plain
      title="Welcome back"
      subtitle="Enter your email and password to log in"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-black text-[#163044] hover:underline dark:text-[#8EC8E8]">Create one</Link>
        </>
      }
    >
      {error && <div className="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-semibold text-foreground">
          Email
          <div className="relative mt-1.5">
            <input
              className="h-12 w-full rounded-2xl border border-transparent bg-[#F4F5F7] px-4 pr-11 text-sm text-foreground outline-none placeholder:text-[#9CA3AF] focus:border-[#163044] dark:bg-[#252A35] dark:focus:border-[#8EC8E8]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <Mail className="pointer-events-none absolute right-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </label>
        <label className="block text-sm font-semibold text-foreground">
          Password
          <div className="mt-1.5">
            <PasswordInput
              leadingIcon={false}
              className="h-12 w-full rounded-2xl border border-transparent bg-[#F4F5F7] px-4 pr-11 text-sm text-foreground outline-none placeholder:text-[#9CA3AF] focus:border-[#163044] dark:bg-[#252A35] dark:focus:border-[#8EC8E8]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
        </label>
        <p className="text-right text-sm">
          <Link href="/forgot-password" className="font-bold text-[#163044] hover:underline dark:text-[#8EC8E8]">Forgot password?</Link>
        </p>
        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-full bg-[#163044] text-sm font-black text-[#F7F4EC] disabled:opacity-60 dark:bg-[#F5F3EE] dark:text-[#11141A]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
