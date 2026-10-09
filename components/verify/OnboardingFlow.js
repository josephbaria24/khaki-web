"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { APPLICATION_ID_TYPES, APPLICATION_SKILLS } from "@/lib/taskerApplication";
import { MUNICIPALITY_NAMES } from "@/lib/palawanLocations";
import { uploadToCloudinary } from "@/lib/uploadFile";
import { api } from "@/lib/store";

const NAVY = "#163044";
const STEPS = [
  { title: "Create Account", hint: "Step 01 · Sign up", icon: "user" },
  { title: "Email Verification", hint: "Step 02 · Verify", icon: "chat" },
  { title: "Face & ID Verification", hint: "Step 03 · KYC & selfie", icon: "scan" },
  { title: "Success", hint: "Step 04 · Complete", icon: "badge" },
];

function stopStream(video) {
  const stream = video?.srcObject;
  if (stream?.getTracks) stream.getTracks().forEach((track) => track.stop());
  if (video) video.srcObject = null;
}

function StepIcon({ name }) {
  const common = { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M6 16.5 4 19V6.8A1.8 1.8 0 0 1 5.8 5h12.4A1.8 1.8 0 0 1 20 6.8v7.9a1.8 1.8 0 0 1-1.8 1.8H6Z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "scan") {
    return (
      <svg {...common}>
        <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5V8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M16 20h2.5a1.5 1.5 0 0 0 1.5-1.5V16" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.2" />
      </svg>
    );
  }
  if (name === "badge") {
    return (
      <svg {...common}>
        <path d="M8 4h8v3.2a4 4 0 0 1-8 0V4Z" />
        <path d="m9 14 1.2 5L12 17.2 13.8 19 15 14" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 19c.7-2.8 2.8-4 5.5-4s4.8 1.2 5.5 4" strokeLinecap="round" />
      <path d="M17 8h3M18.5 6.5v3" strokeLinecap="round" />
    </svg>
  );
}

function TownSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef(null);
  const searchRef = useRef(null);
  const names = MUNICIPALITY_NAMES.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", close);
      cancelAnimationFrame(frame);
    };
  }, [open]);

  function choose(name) {
    onChange(name);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#E6DDD0] bg-white px-3 text-left text-sm font-semibold text-[#163044] outline-none dark:border-white/10 dark:bg-[#11141A]"
      >
        <span className="truncate">{value}</span>
        <span className={`shrink-0 text-xs transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>▾</span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-1 flex max-h-[min(14.5rem,46svh)] flex-col overflow-hidden rounded-xl border border-[#E6DDD0] bg-white shadow-[0_12px_28px_rgba(22,48,68,0.14)] sm:max-h-[min(16.5rem,48svh)] dark:border-white/10 dark:bg-[#11141A]">
          <div className="shrink-0 border-b border-[#E6DDD0] p-2 dark:border-white/10">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "Enter" && names[0]) choose(names[0]);
              }}
              placeholder="Search town"
              aria-label="Search town"
              className="h-9 w-full rounded-lg border border-[#E6DDD0] bg-[#F4F7FB] px-3 text-sm font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#163044]/40 dark:border-white/10 dark:bg-[#11141A]"
            />
          </div>
          <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
            {names.length ? names.map((name) => {
              const on = name === value;
              return (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => choose(name)}
                    className={`flex h-10 w-full items-center px-3 text-left text-sm font-semibold ${on ? "bg-[#E7EEF4] text-[#163044] dark:bg-[#252A35]" : "text-[#163044] hover:bg-[#F4F7FB] dark:hover:bg-white/5"}`}
                  >
                    <span className="truncate">{name}</span>
                  </button>
                </li>
              );
            }) : (
              <li className="px-3 py-3 text-sm font-semibold text-[#163044]/55">No towns match</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Field({ icon, children }) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-xl border border-[#E6DDD0] bg-white px-3 dark:border-white/10 dark:bg-[#11141A]">
      <span className="text-[#163044]/45">{icon}</span>
      {children}
    </label>
  );
}

export default function OnboardingFlow({ user, onSubmit, saving, error, done, onEdit }) {
  const [step, setStep] = useState(done ? 4 : 1);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [town, setTown] = useState(user?.location_area || "Puerto Princesa City");
  const [idType, setIdType] = useState(user?.id_type || APPLICATION_ID_TYPES[0]);
  const [skill, setSkill] = useState(user?.skills?.[0] || "");
  const [license, setLicense] = useState(user?.tasker_application?.license_number || "");
  const [extraOpen, setExtraOpen] = useState(false);
  const [idDocument, setIdDocument] = useState(user?.id_document?.url ? user.id_document : null);
  const [selfie, setSelfie] = useState(user?.id_document?.selfie_url ? { url: user.id_document.selfie_url, public_id: user.id_document.selfie_public_id } : null);
  const [uploading, setUploading] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const inputs = useRef([]);

  useEffect(() => {
    if (done) setStep(4);
  }, [done]);

  useEffect(() => {
    let live = true;
    api.auth.emailStatus().then((status) => {
      if (live) setEmailConfirmed(status.confirmed);
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => () => {
    stopStream(videoRef.current);
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!cameraOn || !videoRef.current || !streamRef.current) return undefined;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
    return undefined;
  }, [cameraOn]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const sendCode = async () => {
    setOtpError("");
    setOtpBusy(true);
    try {
      await api.auth.resendSignupOtp(user.email);
      setSent(true);
      setSeconds(120);
    } catch (err) {
      const msg = err.message || "Could not send a code";
      if (/already confirmed|confirmed/i.test(msg)) {
        setEmailConfirmed(true);
      } else setOtpError(msg);
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmCode = async () => {
    setOtpError("");
    setOtpBusy(true);
    try {
      await api.auth.verifySignupOtp(user.email, otp.join(""));
      setEmailConfirmed(true);
      setStep(3);
    } catch (err) {
      setOtpError(err.message || "Invalid or expired code");
    } finally {
      setOtpBusy(false);
    }
  };

  const onOtp = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && inputs.current[index + 1]) inputs.current[index + 1].focus();
  };

  const continueAccount = () => {
    if (!fullName.trim() || !phone.trim()) {
      setOtpError("Name and mobile number are required.");
      return;
    }
    setOtpError("");
    setStep(2);
  };

  const startCamera = async () => {
    setOtpError("");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setCameraOn(true);
    } catch {
      setOtpError("Allow camera access to take the face photo.");
    }
  };

  const snap = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setUploading("face");
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });
      const uploaded = await uploadToCloudinary(file, "khaki/verification");
      setSelfie({ url: uploaded.url, public_id: uploaded.public_id });
      stopStream(video);
      streamRef.current = null;
      setCameraOn(false);
    } catch (err) {
      setOtpError(err.message || "Could not upload the face photo");
    } finally {
      setUploading("");
    }
  };

  const onId = async (file) => {
    if (!file) return;
    setUploading("id");
    setOtpError("");
    try {
      setIdDocument(await uploadToCloudinary(file, "khaki/verification"));
    } catch (err) {
      setOtpError(err.message || "Could not upload the ID");
    } finally {
      setUploading("");
    }
  };

  const submit = () => {
    if (!fullName.trim() || !phone.trim()) {
      setOtpError("Go back and add your name and mobile number.");
      return;
    }
    if (!idDocument?.url) {
      setOtpError("Upload a photo of your government ID.");
      return;
    }
    if (!selfie?.url) {
      setOtpError("Take a face photo so admin can match it to your ID.");
      return;
    }
    setOtpError("");
    onSubmit(null, {
      id_document: { ...idDocument, selfie_url: selfie.url, selfie_public_id: selfie.public_id || "" },
      profile: {
        full_name: fullName.trim(),
        phone: phone.trim(),
        location_area: town,
        id_type: idType,
        skills: skill ? [skill] : [],
        headline: skill ? `${skill} Tasker` : "",
      },
      application: {
        full_name: fullName.trim(),
        phone: phone.trim(),
        location_area: town,
        id_type: idType,
        skills: skill ? [skill] : [],
        license_number: license.trim(),
        declared: true,
        face_captured_at: new Date().toISOString(),
      },
    });
  };

  const current = STEPS[step - 1];
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const verified = user?.verification_status === "verified";

  return (
    <div>
      <div className="text-center">
        <h1 className="text-[1.65rem] font-black tracking-tight text-[#163044] sm:text-4xl">KHAKI — All-in-One Onboarding</h1>
        <p className="mt-2 text-sm font-semibold text-[#163044]/65 sm:text-base">Sign up, confirm your email, then add your ID and face photo.</p>
      </div>

      <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2">
        {STEPS.map((item, index) => {
          const on = step === index + 1;
          const past = step > index + 1;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => { if (index + 1 < step || (done && index + 1 === 4)) setStep(index + 1); }}
              className={`h-2.5 rounded-full transition-all ${on ? "w-8 bg-[#163044]" : past ? "w-2.5 bg-[#163044]/50" : "w-2.5 bg-[#163044]/20"}`}
              aria-label={item.title}
            />
          );
        })}
      </div>

      <article className="relative mx-auto mt-8 w-full max-w-[420px] rounded-[1.6rem] bg-white px-4 pb-5 pt-8 shadow-[0_16px_40px_rgba(22,48,68,0.1)] dark:bg-[#1A1E27]">
        <span className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#163044] text-white shadow-[0_8px_18px_rgba(22,48,68,0.25)]">
          <StepIcon name={current.icon} />
        </span>
        <h2 className="text-center text-xl font-black text-[#163044]">{step}. {current.title}</h2>
        <p className="mt-2 text-center">
          <span className="rounded-full bg-[#E7EEF4] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#163044] dark:bg-[#252A35]">{current.hint}</span>
        </p>

        {error || otpError ? <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error || otpError}</p> : null}

        {step === 1 ? (
          <div className="mt-5 rounded-[1.2rem] border border-[#E6DDD0] p-4 dark:border-white/10">
            <p className="text-center text-lg font-black text-[#163044]">Your account</p>
            <div className="mt-4 space-y-2.5">
              <Field icon={<MailIcon />}>
                <input className="h-full w-full bg-transparent text-sm font-semibold text-[#163044] outline-none" value={user?.email || ""} readOnly />
              </Field>
              <Field icon={<PhoneIcon />}>
                <input className="h-full w-full bg-transparent text-sm font-semibold text-[#163044] outline-none" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field icon={<UserIcon />}>
                <input className="h-full w-full bg-transparent text-sm font-semibold text-[#163044] outline-none" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <TownSelect value={town} onChange={setTown} />
            </div>
            <button type="button" onClick={continueAccount} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white">
              Continue →
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5 rounded-[1.2rem] border border-[#E6DDD0] p-4 text-center dark:border-white/10">
            <p className="text-lg font-black text-[#163044]">Verify your email</p>
            <p className="mt-1 text-sm text-[#163044]/70">We send a 6-digit code to {user?.email}</p>
            {emailConfirmed ? (
              <p className="mt-4 rounded-xl bg-[#D7F0EA] px-3 py-3 text-sm font-bold text-[#0D666A]">This email is already confirmed.</p>
            ) : (
              <>
                <div className="mt-4 flex justify-center gap-1.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => { inputs.current[index] = node; }}
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => onOtp(index, e.target.value)}
                      className="h-12 w-10 rounded-lg border border-[#E6DDD0] bg-[#FBF8F1] text-center text-lg font-black text-[#163044] outline-none focus:border-[#163044] dark:border-white/10 dark:bg-[#11141A]"
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold text-[#163044]/55">{seconds > 0 ? `Code expires in ${clock}` : sent ? "Code expired. Send a new one." : "Send a code to your email."}</p>
              </>
            )}
            <button
              type="button"
              disabled={otpBusy || (!emailConfirmed && otp.join("").length < 6)}
              onClick={emailConfirmed ? () => setStep(3) : confirmCode}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white disabled:opacity-50"
            >
              {emailConfirmed ? "Continue →" : "Verify code →"}
            </button>
            {emailConfirmed ? null : (
              <button type="button" disabled={otpBusy || seconds > 0} onClick={sendCode} className="mt-3 text-sm font-bold text-[#163044] underline-offset-2 hover:underline disabled:opacity-50">
                {otpBusy ? "Sending…" : sent ? "Didn't receive code? Resend" : "Send code"}
              </button>
            )}
            <button type="button" onClick={() => setStep(1)} className="mt-2 block w-full text-xs font-bold text-[#163044]/50">Back</button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-5 rounded-[1.2rem] border border-[#E6DDD0] p-4 dark:border-white/10">
            <p className="text-center text-lg font-black text-[#163044]">Face & ID verification</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7EEF4] text-[#163044]"><IdIcon /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#163044]">Government ID scan</p>
                  <p className="text-xs text-[#163044]/60">Upload a photo of your ID</p>
                  <select className="mt-2 h-9 w-full rounded-lg bg-[#F3EFE3] px-2 text-xs font-bold text-[#163044]" value={idType} onChange={(e) => setIdType(e.target.value)}>
                    {APPLICATION_ID_TYPES.map((name) => <option key={name}>{name}</option>)}
                  </select>
                  <input type="file" accept="image/*,application/pdf" className="mt-2 block w-full text-xs text-[#163044]" onChange={(e) => onId(e.target.files?.[0])} />
                  {uploading === "id" ? <p className="mt-1 text-xs font-semibold text-[#163044]/60">Uploading…</p> : null}
                  {idDocument?.url ? <p className="mt-1 text-xs font-bold text-[#1A7A58]">ID attached</p> : null}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7EEF4] text-[#163044]"><CameraIcon /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#163044]">Liveness selfie check</p>
                  <p className="text-xs text-[#163044]/60">Look at the camera. Admin matches this to your ID.</p>
                  {cameraOn ? (
                    <video ref={videoRef} playsInline muted className="mt-2 aspect-[4/3] w-full rounded-xl bg-[#163044] object-cover" />
                  ) : selfie?.url ? (
                    <img src={selfie.url} alt="" className="mt-2 aspect-[4/3] w-full rounded-xl object-cover" />
                  ) : (
                    <div className="mt-2 flex aspect-[4/3] items-center justify-center rounded-full border border-dashed border-[#163044]/30 bg-[#FBF8F1] text-[11px] font-bold text-[#163044]/50">Position face in frame</div>
                  )}
                  <button type="button" onClick={cameraOn ? snap : startCamera} disabled={uploading === "face"} className="mt-2 text-xs font-black text-[#163044]">
                    {uploading === "face" ? "Saving…" : cameraOn ? "Capture" : selfie?.url ? "Retake selfie" : "Open camera"}
                  </button>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setExtraOpen((value) => !value)} className="mt-3 text-xs font-bold text-[#163044]/60">
              {extraOpen ? "Hide skill and license" : "Add skill or license (optional)"}
            </button>
            {extraOpen ? (
              <div className="mt-2 space-y-2">
                <select className="h-10 w-full rounded-xl bg-[#F3EFE3] px-3 text-sm font-semibold text-[#163044]" value={skill} onChange={(e) => setSkill(e.target.value)}>
                  <option value="">Main skill</option>
                  {APPLICATION_SKILLS.map((name) => <option key={name}>{name}</option>)}
                </select>
                <input className="h-10 w-full rounded-xl bg-[#F3EFE3] px-3 text-sm font-semibold text-[#163044] outline-none" placeholder="License number" value={license} onChange={(e) => setLicense(e.target.value)} />
              </div>
            ) : null}
            <button type="button" disabled={saving || Boolean(uploading)} onClick={submit} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white disabled:opacity-60">
              {saving ? "Sending…" : "Start verification →"}
            </button>
            <button type="button" onClick={() => setStep(2)} className="mt-2 block w-full text-center text-xs font-bold text-[#163044]/50">Back</button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-5 rounded-[1.2rem] border border-[#E6DDD0] p-5 text-center dark:border-white/10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D7F0EA] text-3xl font-black text-[#0D666A]">✓</span>
            <p className="mt-3 text-2xl font-black text-[#163044]">{verified ? "Verified!" : "Sent for review"}</p>
            <div className="mx-auto mt-3 w-36 rounded-2xl border border-[#E8DCC4] bg-[#FBF8F1] px-3 py-3 dark:bg-[#11141A]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A6410]">{verified ? "ID & Face" : "Pending"}</p>
              <p className="mt-1 text-sm font-black text-[#163044]">{verified ? "Approved" : "With admin"}</p>
            </div>
            <p className="mt-3 text-sm text-[#163044]/70">
              {verified
                ? "You can post gawain and accept jobs."
                : "Admin matches your face photo to your ID. You can browse while you wait."}
            </p>
            <Link href="/dashboard" className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#163044] text-sm font-black text-white">
              Continue to Khaki →
            </Link>
            {onEdit ? (
              <button type="button" onClick={() => { onEdit(); setStep(3); }} className="mt-3 text-xs font-bold text-[#163044]/60">Update ID or face photo</button>
            ) : null}
          </div>
        ) : null}
      </article>

      <div className="mx-auto mt-6 grid max-w-3xl gap-3 rounded-[1.4rem] bg-[#E7EEF4] px-4 py-4 text-[#163044] sm:grid-cols-3 dark:bg-[#1A1E27]">
        <p className="text-center text-xs font-bold sm:text-left">Email code before ID upload</p>
        <p className="text-center text-xs font-bold">ID photo plus a live face photo</p>
        <p className="text-center text-xs font-bold sm:text-right">Admin reviews the match</p>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M11 18h2" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3" />
      <path d="M6 19c.8-2.6 2.8-4 6-4s5.2 1.4 6 4" strokeLinecap="round" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M14 10h5M14 14h3" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h3l2-2h6l2 2h3v10H4V8Z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
