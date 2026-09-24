import { cn, initials } from "@/lib/khaki";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export default function ChatAvatar({ name, size = "md", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[#C9D6E0] font-black text-[#163044]",
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
