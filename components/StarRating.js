"use client";

export default function StarRating({ value = 0, onChange, size = "md", readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  const text = size === "sm" ? "text-base" : "text-2xl";

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const on = star <= Number(value || 0);
        if (readOnly) {
          return (
            <span key={star} className={`${text} leading-none ${on ? "text-[#3D5C6E]" : "text-[#C9D6E0]"}`}>
              ★
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`${text} leading-none transition ${on ? "text-[#3D5C6E]" : "text-[#C9D6E0] hover:text-[#8BA8B8]"}`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
