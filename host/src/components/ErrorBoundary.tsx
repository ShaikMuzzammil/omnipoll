import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, RefreshCw, Home } from 'lucide-react';

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-terracotta-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BarChart3 size={28} className="text-terracotta-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-500 mb-1">An unexpected error occurred.</p>
          {this.state.error && (
            <p className="text-xs text-red-500 font-mono bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3 mb-5 text-left break-all">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <Link to="/" className="flex items-center gap-2 bg-white border border-cream-300 hover:bg-cream-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Home size={14} /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export function FullPageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-cream-300 rounded-full" />
          <div className="absolute inset-0 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 bg-terracotta-50 rounded-full flex items-center justify-center">
            <BarChart3 size={14} className="text-terracotta-500" />
          </div>
        </div>
        <p className="text-sm text-slate-500 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
      <div className="w-5 h-5 border-2 border-terracotta-300 border-t-terracotta-500 rounded-full animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
