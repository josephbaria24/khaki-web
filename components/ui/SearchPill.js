import { Search } from "@/components/icons";

export default function SearchPill({ value, onChange, placeholder = "Search...", onSubmit }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className="search-pill"
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-[#3E7498] dark:text-[#8BA8B8]" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#163044] placeholder:text-[#6B8496] dark:text-[#E7F1FA] dark:placeholder:text-[#8BA8B8]"
      />
    </form>
  );
}
