import { useAppStore } from '@/store/useAppStore';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
      {toasts.map((toast) => {
        const styles =
          toast.type === 'success'
            ? 'bg-gym-success border-emerald-400 text-white'
            : toast.type === 'error'
              ? 'bg-gym-danger border-red-400 text-white'
              : 'bg-gym-navy border-blue-400 text-white';

        const Icon =
          toast.type === 'success' ? CheckCircle : toast.type === 'error' ? XCircle : Info;

        return (
          <div
            key={toast.id}
            className={`animate-slide-down pointer-events-auto rounded-xl border shadow-xl px-4 py-3 flex items-start gap-3 ${styles}`}
            onClick={() => removeToast(toast.id)}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}
