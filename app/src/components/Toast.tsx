import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const borderColors = {
  success: 'border-l-success',
  error: 'border-l-danger',
  info: 'border-l-info',
};

const iconColors = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-[380px]">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`bg-surface-elevated border border-white/[0.06] border-l-[3px] ${borderColors[toast.type]} rounded-lg p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-start gap-3`}
            >
              <Icon className={`w-4 h-4 mt-0.5 ${iconColors[toast.type]} flex-shrink-0`} />
              <p className="text-sm text-white/60 flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/35 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
