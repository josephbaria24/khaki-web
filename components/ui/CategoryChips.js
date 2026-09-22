"use client";

export default function CategoryChips({ categories, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={value === c ? "chip-active shrink-0" : "chip-inactive shrink-0"}
        >
          {c.replace(/\s*\(.*\)/, "")}
        </button>
      ))}
    </div>
  );
}
