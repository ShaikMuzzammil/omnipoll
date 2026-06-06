import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Hash, ArrowRight, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinByCode } from "@/lib/api";
import { toast } from "sonner";

export default function Join() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const [code, setCode] = useState(paramCode || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (paramCode && paramCode.length === 6) handleJoin(paramCode);
  }, [paramCode]);

  const handleJoin = async (c?: string) => {
    const joinCode = (c || code).toUpperCase().trim();
    if (joinCode.length < 4) { toast.error("Enter a valid poll code"); return; }
    setLoading(true);
    try {
      await joinByCode(joinCode);
      navigate(`/participate/${joinCode}`);
    } catch {
      toast.error("Poll not found. Check the code and try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-warm-white dark:bg-background flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-terracotta mx-auto flex items-center justify-center mb-4">
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-foreground">Join a Poll</h1>
          <p className="text-muted-foreground mt-2">Enter the code shown on screen</p>
        </div>

        {/* Code input */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input ref={inputRef} value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8))}
              placeholder="ABC123" className="pl-10 h-14 text-2xl font-mono tracking-[0.3em] text-center font-bold"
              onKeyDown={e => e.key === "Enter" && handleJoin()} autoComplete="off" />
          </div>
          <Button onClick={() => handleJoin()} disabled={loading || code.length < 4} className="w-full h-12 bg-terracotta hover:bg-terracotta/90 gap-2 text-base font-semibold">
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ArrowRight className="w-4 h-4" />Join Poll</>}
          </Button>
        </div>

        {/* QR Code */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Or scan with your phone</p>
          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <QRCodeCanvas value={`${window.location.origin}/join`} size={120} fgColor="#D96C4A" bgColor="#ffffff" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{window.location.origin}/join</p>
        </div>
      </motion.div>
    </div>
  );
}
