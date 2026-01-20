import { useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircleIcon className="text-green-600" />,
    error: <ErrorIcon className="text-red-600" />,
    info: <InfoIcon className="text-blue-600" />,
    warning: <WarningIcon className="text-orange-600" />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-orange-50 border-orange-200'
  };

  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[type]} animate-slide-in`}>
      {icons[type]}
      <span className="text-sm font-medium text-foreground">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/5 rounded transition-colors"
      >
        <CloseIcon fontSize="small" />
      </button>
    </div>
  );
}
