import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimerRingProps {
  seconds: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  danger?: boolean;
}

export default function TimerRing({
  seconds, total, size = 72, strokeWidth = 6, danger = false,
}: TimerRingProps) {
  const pct    = Math.max(0, Math.min(1, seconds / total));
  const r      = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const mins   = Math.floor(seconds / 60);
  const secs   = seconds % 60;

  const color  = danger ? '#ef4444' : pct > 0.5 ? '#D96C4A' : '#f59e0b';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F5E6C8" strokeWidth={strokeWidth}/>
        {/* Progress */}
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset, stroke: color }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono font-bold text-sm ${danger ? 'text-red-500' : 'text-slate-700'}`}>
          {mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${secs}s`}
        </span>
      </div>
    </div>
  );
}
