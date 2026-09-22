"use client";

export function PageEnter({ children, className = "" }) {
  return <div className={`animate-page-enter ${className}`.trim()}>{children}</div>;
}

export function FadeIn({ children, className = "", delay = 0 }) {
  return (
    <div className={`animate-fade-in-up ${className}`.trim()} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

export function Stagger({ children, className = "" }) {
  return <div className={`stagger-children ${className}`.trim()}>{children}</div>;
}

export function Collapse({ open, children, className = "" }) {
  return (
    <div className={`profile-collapse ${open ? "is-open" : ""} ${className}`.trim()} aria-hidden={!open}>
      <div className="profile-collapse-inner">
        <div>{children}</div>
      </div>
    </div>
  );
}
