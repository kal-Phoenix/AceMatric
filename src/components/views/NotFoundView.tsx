import { SearchX, Home } from 'lucide-react';

interface NotFoundViewProps {
  onNavigate: (tab: string) => void;
}

export default function NotFoundView({ onNavigate }: NotFoundViewProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <SearchX className="w-10 h-10 text-rose-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-semibold text-white">404</h1>
          <h2 className="text-xl font-semibold text-white">Page Not Found</h2>
          <p className="text-sm text-slate-400">
            The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to the dashboard.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
}
