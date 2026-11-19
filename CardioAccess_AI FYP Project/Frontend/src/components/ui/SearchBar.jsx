import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="relative block min-w-[220px] flex-1">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="field pl-9"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
