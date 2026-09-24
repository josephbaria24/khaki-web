import { cn } from "@/lib/khaki";

export default function ChatBubble({
  mine = false,
  first = true,
  last = true,
  entering = false,
  children,
}) {
  return (
    <div
      className={cn(
        "chat-bubble",
        mine ? "chat-bubble-mine" : "chat-bubble-theirs",
        first && "is-first",
        last && "is-last",
        last && "has-tail",
        entering && (mine ? "chat-bubble-enter-mine" : "chat-bubble-enter-theirs")
      )}
    >
      {children}
    </div>
  );
}
