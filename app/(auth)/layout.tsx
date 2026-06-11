import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-bg mesh-gradient flex flex-col">
      <div className="h-14 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-playfair text-xl font-bold text-charcoal dark:text-foreground">
          <span className="w-7 h-7 rounded-lg bg-terracotta flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="text-terracotta">Omni</span>Poll
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
