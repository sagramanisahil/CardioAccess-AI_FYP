const VARIANTS = {
  primary: "btn-primary text-white",
  secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50",
  ghost: "text-clinic-blue hover:bg-blue-50",
  danger: "bg-red-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-700",
};

export default function Button({ variant = "primary", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
