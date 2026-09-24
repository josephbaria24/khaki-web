"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "@/components/icons";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  required,
  className = "auth-field pl-10 pr-11",
  ...props
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type={show ? "text" : "password"}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={props.autoComplete || "current-password"}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
