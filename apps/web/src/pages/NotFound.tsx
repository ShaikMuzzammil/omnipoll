import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-parchment dark:bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-black text-terracotta/20 leading-none select-none">404</div>
        <h1 className="text-3xl font-bold text-charcoal dark:text-white mt-2 mb-3">Page not found</h1>
        <p className="text-slate dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()} className="btn-primary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/" className="px-4 py-2 rounded-lg border border-clay dark:border-gray-600 text-charcoal dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
