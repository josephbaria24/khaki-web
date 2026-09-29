"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Car, ChevronLeft, Motorbike, ShieldCheck, User, Van, Wrench } from "@/components/icons";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/khaki";
import { needsTaskerVerification } from "@/lib/roles";
import { VEHICLE_OPTIONS, vehicleLabel } from "@/lib/serviceTemplates";
import { api } from "@/lib/store";
import { toast } from "@/lib/toast";

const ICONS = { Car, Motorbike, Van };

function useShown(open) {
  const [shown, setShown] = useState(open);
  useEffect(() => {
    if (open) {
      setShown(true);
      return undefined;
    }
    if (!shown) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setShown(false), reduced ? 0 : 170);
    return () => window.clearTimeout(timer);
  }, [open, shown]);
  return [shown, setShown];
}

function Row({ icon, title, detail, onClick, href, open }) {
  const body = (
    <>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F3EFE3] text-[#163044]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold leading-tight text-[#163044]">{title}</span>
        <span className="block truncate text-[11px] font-medium text-[#2A3F4D]/55">{detail}</span>
      </span>
      <ChevronLeft className={cn("post-select-chevron h-3.5 w-3.5 shrink-0 text-[#163044]/45", open && "is-open")} />
    </>
  );
  const className = "tasker-setup-row flex w-full items-center gap-2.5 px-2.5 py-2 text-left";
  if (href) return <Link href={href} className={className}>{body}</Link>;
  return <button type="button" onClick={onClick} className={className} aria-expanded={open}>{body}</button>;
}

export default function TaskerVehicleSetup() {
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [shown, setShown] = useShown(open);
  const [vehicleShown, setVehicleShown] = useShown(vehicleOpen);
  const [vehicleType, setVehicleType] = useState(user?.vehicle_type || "");
  const [model, setModel] = useState(user?.vehicle_model || "");
  const [plate, setPlate] = useState(user?.plate_number || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVehicleType(user?.vehicle_type || "");
    setModel(user?.vehicle_model || "");
    setPlate(user?.plate_number || "");
  }, [user?.vehicle_type, user?.vehicle_model, user?.plate_number]);

  const vehicleDetail = user?.vehicle_type
    ? [vehicleLabel(user.vehicle_type), user.vehicle_model].filter(Boolean).join(" · ")
    : "Hindi pa naka-set";
  const verifyDetail = user?.verification_status === "verified"
    ? "Verified"
    : user?.verification_status === "pending"
      ? "Pending review"
      : needsTaskerVerification(user)
        ? "Kailangan bago mag-bid"
        : "ID at credentials";

  const save = async () => {
    setSaving(true);
    try {
      await api.profile.update({
        vehicle_type: vehicleType,
        vehicle_model: vehicleType ? model.trim() : "",
        plate_number: vehicleType ? plate.trim().toUpperCase() : "",
      });
      await refresh();
      toast.success("Na-save ang sasakyan");
      setVehicleOpen(false);
    } catch (err) {
      toast.error(err.message || "Hindi ma-save ang sasakyan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={cn("relative", shown && "z-30")}>
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-[#F3EFE3] px-4 text-left text-sm font-semibold text-[#163044]"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0 truncate">Tasker setup</span>
        <ChevronLeft className={cn("post-select-chevron h-4 w-4 shrink-0 text-[#163044]/55", open && "is-open")} />
      </button>
      {shown ? (
        <div
          className={cn(
            "tasker-setup-panel mt-1.5 overflow-hidden rounded-xl border border-black/5 bg-[#FFFCF7] shadow-[0_16px_40px_rgba(22,48,68,0.16)]",
            !open && "is-leaving"
          )}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget || open) return;
            setShown(false);
          }}
        >
          <Row
            icon={<Motorbike className="h-3.5 w-3.5" color="#1F7A6B" />}
            title="Setup tasker vehicle"
            detail={vehicleDetail}
            open={vehicleOpen}
            onClick={() => setVehicleOpen((v) => !v)}
          />
          {vehicleShown ? (
            <div
              className={cn("tasker-setup-panel border-t border-[#EFE7DA] px-3 py-2.5", !vehicleOpen && "is-leaving")}
              onAnimationEnd={(e) => {
                if (e.target !== e.currentTarget || vehicleOpen) return;
                setVehicleShown(false);
              }}
            >
              <div className="grid gap-1.5">
                {VEHICLE_OPTIONS.map((option) => {
                  const on = vehicleType === option.value;
                  const Icon = ICONS[option.icon];
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVehicleType(on ? "" : option.value)}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-lg border px-2.5 text-left",
                        on ? "border-[#163044] bg-[#163044] text-[#F7F4EC]" : "border-[#EFE7DA] bg-white text-[#163044]"
                      )}
                    >
                      {Icon ? <Icon className="h-3.5 w-3.5" color={on ? "#F7F4EC" : option.color} /> : null}
                      <span className="text-[13px] font-bold">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              {vehicleType ? (
                <div className="mt-1.5 grid gap-1.5">
                  <input
                    className="h-9 rounded-lg bg-[#F3EFE3] px-3 text-[13px] font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#2A3F4D]/40"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Model, e.g. Yamaha NMAX"
                  />
                  <input
                    className="h-9 rounded-lg bg-[#F3EFE3] px-3 text-[13px] font-semibold text-[#163044] outline-none placeholder:font-medium placeholder:text-[#2A3F4D]/40"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="Plate number"
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-2 h-9 rounded-lg bg-[#163044] px-4 text-[13px] font-black text-[#F7F4EC] disabled:opacity-60"
              >
                {saving ? "Saving..." : "I-save ang sasakyan"}
              </button>
            </div>
          ) : null}
          <Row icon={<User className="h-3.5 w-3.5" />} title="Profile & about" detail="Pangalan, town, at intro" href="/profile" />
          <Row icon={<Wrench className="h-3.5 w-3.5" color="#C46A2E" />} title="Skills & pricing" detail="Serbisyo at rate" href="/profile" />
          <Row icon={<ShieldCheck className="h-3.5 w-3.5" color="#1F7A6B" />} title="Verification" detail={verifyDetail} href="/verify" />
        </div>
      ) : null}
    </section>
  );
}
