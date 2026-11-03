import HugeIcon from "@/components/icons";
import { POSTING_EXPECTATIONS } from "@/lib/qualification";
import { cn } from "@/lib/khaki";

export default function PostingExpectations({ stage, onChange }) {
  return (
    <div className="mt-4 space-y-2.5">
      {POSTING_EXPECTATIONS.map((item) => {
        const selected = stage === item.stage;
        return (
          <button
            key={item.stage}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item.stage)}
            className={cn(
              "flex w-full items-center gap-3 rounded-[1.15rem] px-3 py-3 text-left transition",
              selected && "ring-2 ring-[#163044] ring-offset-2 ring-offset-white dark:ring-[#F5F3EE] dark:ring-offset-[#11141A]"
            )}
            style={{ background: item.bg, color: item.fg }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: item.iconBg, color: item.fg }}
            >
              <HugeIcon name={item.icon} className="h-5 w-5" color={item.fg} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              {item.premium ? (
                <span className="mb-1 inline-flex rounded-md bg-[#3A2A08] px-1.5 py-0.5 text-[9px] font-black tracking-[0.08em] text-[#F8E7B0]">
                  PREMIUM
                </span>
              ) : null}
              <span className="block text-[14px] font-black leading-tight">{item.title}</span>
              <span className="mt-0.5 block text-[12px] font-medium leading-snug opacity-80">{item.detail}</span>
            </span>
            <span
              className="w-[72px] shrink-0 rounded-2xl px-2 py-1.5 text-center"
              style={{ background: item.pill, color: item.fg }}
            >
              <span className="block text-[13px] font-black leading-none">{item.feeLabel}</span>
              <span className="mt-1 block text-[9px] font-bold leading-none opacity-80">posting fee</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
