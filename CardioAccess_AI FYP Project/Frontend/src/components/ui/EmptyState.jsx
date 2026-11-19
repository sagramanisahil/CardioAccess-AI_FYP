export default function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <p className="font-display text-base font-semibold text-slate-800">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p>}
    </div>
  );
}
