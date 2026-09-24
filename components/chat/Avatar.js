import { cn, initials, avatarTone } from "@/lib/khaki";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export default function ChatAvatar({ name, size = "md", className = "" }) {
  const tone = avatarTone(name);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-black",
        SIZES[size] || SIZES.md,
        className
      )}
      style={{ background: tone.bg, color: tone.fg }}
    >
      {initials(name)}
    </span>
  );
}
