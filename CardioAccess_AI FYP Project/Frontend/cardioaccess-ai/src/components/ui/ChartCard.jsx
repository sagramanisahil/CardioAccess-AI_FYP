export default function ChartCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`card flex flex-col shadow-lift ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-navy-950">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </section>
  );
}
