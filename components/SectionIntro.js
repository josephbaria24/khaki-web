export default function SectionIntro({ pill, title, sub, action, className = "" }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {pill ? (
            <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#163044] px-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F7F4EC]">
              {pill}
            </span>
          ) : null}
          <h2 className="text-[17px] font-black leading-none tracking-tight text-[#163044] sm:text-lg">{title}</h2>
        </div>
        {action}
      </div>
      {sub ? <p className="mt-1.5 max-w-md text-[12px] leading-snug text-[#2A3F4D]/65">{sub}</p> : null}
    </div>
  );
}
