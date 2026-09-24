import { X } from 'lucide-react';
import type { ToastState } from '../hooks/useToast';

interface ToastProps {
  toast: ToastState;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl border shadow-xl transition-all duration-300 transform scale-100 hover:scale-[1.02] ${
      toast.type === 'success'
        ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300'
        : toast.type === 'warning'
          ? 'bg-amber-950/95 border-amber-500/40 text-amber-300'
          : 'bg-slate-900/95 border-slate-700/50 text-slate-200'
    }`}>
      <span className="text-base shrink-0">
        {toast.type === 'success' ? '[Success]' : toast.type === 'warning' ? '[Warning]' : '[Info]'}
      </span>
      <span className="text-xs font-bold font-sans tracking-wide leading-none">{toast.message}</span>
      <button onClick={onDismiss} className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
