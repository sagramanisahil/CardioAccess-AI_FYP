import { useContext } from "react";
import ToastContext from "../components/ui/toast-context";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) return { notify: () => {} };
  return context;
}
