import { useMemo, useState } from "react";
import ToastContext from "./toast-context";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(
    () => ({
      notify(message) {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((current) => [...current, { id, message }]);
        setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== id));
        }, 3200);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-in pointer-events-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-clinic-ink shadow-lift">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
