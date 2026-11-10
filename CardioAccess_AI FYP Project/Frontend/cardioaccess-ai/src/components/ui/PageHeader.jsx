export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clinic-mute">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-[1.7rem] font-semibold text-clinic-ink">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
