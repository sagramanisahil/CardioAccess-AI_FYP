export default function StatCard({ label, value, detail, accent = "bg-clinic-blue" }) {
  return (
    <article className="card-hover card relative overflow-hidden bg-gradient-to-br from-white via-white to-sky-50 px-5 py-4">
      <span className={`absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-20 blur-xl ${accent}`} />
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-950">{value}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}
    </article>
  );
}
