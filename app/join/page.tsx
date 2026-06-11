'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinByCode } from '@/lib/api';
import { toast } from 'sonner';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) { toast.error('Enter a join code'); return; }
    setLoading(true);
    try {
      const data = await joinByCode(code.trim().toUpperCase()) as { poll: { code: string } };
      router.push(`/participate/${data.poll.code}`);
    } catch {
      toast.error('Poll not found — check your code');
    } finally { setLoading(false); }
  };

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
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="bg-warm-white dark:bg-card border border-clay/30 rounded-2xl shadow-xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/10 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">📡</span>
            </div>
            <h1 className="font-playfair text-2xl font-bold text-charcoal dark:text-foreground mb-2">Join a poll</h1>
            <p className="text-sm text-slate dark:text-muted-foreground mb-6">Enter the 6-character code from your host</p>

            <div className="flex flex-col gap-3">
              <Input
                placeholder="AB12CD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="text-center font-mono tracking-[0.4em] text-xl h-12 uppercase border-clay/40 focus:border-terracotta"
                maxLength={6}
                autoFocus
              />
              <Button onClick={handleJoin} disabled={loading || code.length < 6} size="lg" className="gap-2">
                {loading ? 'Finding poll…' : 'Join Now'} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              No account needed to participate
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
