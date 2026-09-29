"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/lib/AuthContext";
import { homePathFor } from "@/lib/roles";
import { toast } from "@/lib/toast";

export default function RegisterPage() {
  return <RegisterForm />;
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [posterType, setPosterType] = useState("individual");
  const [companyName, setCompanyName] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (posterType === "company" && !companyName.trim()) {
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
        role: "poster",
        poster_type: posterType,
        company_name: companyName,
      });
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

  return (
    <AuthShell
      title="Create your account"
        subtitle="One account for posting and taking gawain. Switch Poster or Tasker anytime after you sign in."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </>
      }
    >
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2 rounded-xl bg-muted/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account type</p>
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
        <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          After signup, i-submit ang government ID once. Admin verifies it before you can post or accept gawain. Switch Poster or Tasker anytime.
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
