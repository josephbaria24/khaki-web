export default function SectionIntro({ pill, title, sub, action, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {pill ? (
            <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#163044] px-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F7F4EC] dark:bg-[#2BA3D9] dark:text-[#0B1A24]">
              {pill}
            </span>
          ) : null}
          <h2 className="min-w-0 break-words text-[17px] font-black leading-tight tracking-tight text-[#163044] sm:text-lg dark:text-[#F5F3EE]">{title}</h2>
        </div>
        {action}
      </div>
      {sub ? <p className="mt-1.5 max-w-xl break-words text-[12px] leading-snug text-[#2A3F4D]/65 dark:text-[#F5F3EE]/55">{sub}</p> : null}
    </div>
  );
}
