import React from 'react';
import { motion } from 'framer-motion';
import {
  Archive, AlertTriangle, SearchX, Star, BarChart2,
  MapPin, FileText, Wifi, WifiOff, RefreshCw,
} from 'lucide-react';

const ICONS = {
  archive:   Archive,
  error:     AlertTriangle,
  search:    SearchX,
  watchlist: Star,
  market:    BarChart2,
  locality:  MapPin,
  brief:     FileText,
  offline:   WifiOff,
};

const VARIANT_STYLES = {
  default: {
    wrapper: 'bg-white border border-dashed border-slate-200',
    icon:    'bg-slate-50 border-slate-200 text-slate-400',
    title:   'text-slate-700',
    body:    'text-slate-400',
  },
  error: {
    wrapper: 'bg-red-50 border border-red-200/60',
    icon:    'bg-red-100 border-red-200 text-red-500',
    title:   'text-red-800',
    body:    'text-red-500',
  },
  info: {
    wrapper: 'bg-blue-50/50 border border-blue-100',
    icon:    'bg-blue-100 border-blue-200 text-blue-600',
    title:   'text-blue-900',
    body:    'text-blue-500',
  },
};

/**
 * EmptyState — reusable empty / error / zero-data display.
 *
 * Props:
 *   icon      {string}         Key from ICONS map, or a Lucide component
 *   title     {string}         Bold heading
 *   body      {string}         Subtext
 *   action    {ReactNode}      Optional CTA button
 *   variant   {string}         "default" | "error" | "info"
 *   compact   {boolean}        Smaller padding (for use inside cards)
 *   onRetry   {function}       If set, shows a Retry button automatically
 */
export function EmptyState({
  icon = 'archive',
  title = 'Nothing here yet',
  body,
  action,
  variant = 'default',
  compact = false,
  onRetry,
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const Icon   = typeof icon === 'string' ? (ICONS[icon] || Archive) : icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rounded-3xl text-center ${compact ? 'p-8' : 'p-12'} ${styles.wrapper}`}
      role="status"
      aria-label={title}
    >
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${styles.icon}`}>
        <Icon className="w-5 h-5" />
      </div>

      <h3 className={`font-bold text-sm ${styles.title}`}>{title}</h3>

      {body && (
        <p className={`text-xs mt-1.5 max-w-xs mx-auto leading-relaxed ${styles.body}`}>
          {body}
        </p>
      )}

      {(action || onRetry) && (
        <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
          {action}
        </div>
      )}
    </motion.div>
  );
}

export default EmptyState;
