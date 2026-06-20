import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label:     string;
  value:     string | number;
  icon:      LucideIcon;
  color?:    string;
  bgColor?:  string;
  trend?:    { value: number; label: string };
  delay?:    number;
  className?: string;
}

export default function StatsCard({
  label, value, icon: Icon, color = 'text-terracotta-600',
  bgColor = 'bg-terracotta-100', trend, delay = 0, className,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={cn('stat-card group', className)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', bgColor)}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <div className={cn('text-3xl font-display font-bold', color)}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-slate-400 font-normal">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}
