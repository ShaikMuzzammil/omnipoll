import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, ArrowRight, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

export default function Join() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      toast.error('Enter a valid join code');
      return;
    }
    setLoading(true);
    try {
      navigate(`/participate/${trimmed}`);
    } catch {
      toast.error('Invalid join code');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyInput = (val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(upper);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment via-cream to-terracotta/10 dark:from-background dark:via-gray-900 dark:to-terracotta/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-terracotta rounded-xl flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-charcoal dark:text-white">OmniPoll</span>
          </div>
          <p className="text-slate dark:text-gray-400">Enter a join code to participate in a live poll</p>
        </div>

        {/* Join Card */}
        <div className="card p-8">
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Join Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate dark:text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={e => handleKeyInput(e.target.value)}
                  placeholder="e.g. ABCD1234"
                  className="input-field pl-10 text-center text-2xl font-bold font-mono tracking-[0.3em] uppercase"
                  maxLength={8}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </div>
            </div>

            {/* Code preview blocks */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-9 h-10 border-2 rounded-lg flex items-center justify-center text-sm font-bold font-mono transition-all ${
                    i < code.length
                      ? 'border-terracotta bg-terracotta/10 text-terracotta'
                      : 'border-clay/40 dark:border-gray-600 text-transparent'
                  }`}
                >
                  {code[i] || '·'}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 4}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Join Poll <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* QR Section */}
        <div className="card p-6 mt-4 text-center">
          <p className="text-xs text-slate dark:text-gray-400 mb-3 font-medium uppercase tracking-wider">Or scan with your phone</p>
          <div className="flex justify-center">
            <QRCodeCanvas
              value={`${window.location.origin}/join`}
              size={128}
              fgColor="#E07A5F"
              bgColor="#FAF7F4"
              className="rounded-lg"
            />
          </div>
          <p className="text-xs text-slate dark:text-gray-400 mt-2">{window.location.origin}/join</p>
        </div>

        <p className="text-center text-xs text-slate dark:text-gray-500 mt-6">
          Join codes are case-insensitive and expire when the poll closes.
        </p>
      </div>
    </div>
  );
}
