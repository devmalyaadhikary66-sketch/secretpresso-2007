import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  archiveLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onArchive?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  archiveLabel = 'Archive (Safe)',
  isDestructive = true,
  onConfirm,
  onCancel,
  onArchive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#160e0a] border border-[#382319] w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-[#cfa851]/10 text-[#cfa851] border border-[#cfa851]/20'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-400">Please confirm your action</p>
          </div>
        </div>

        {isDestructive && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>This action may permanently remove data.</span>
          </div>
        )}

        <p className="text-sm text-zinc-300 leading-relaxed mb-6">{message}</p>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-xl font-medium text-zinc-300 hover:bg-zinc-800/80 transition"
          >
            {cancelLabel}
          </button>

          {onArchive && (
            <button
              onClick={onArchive}
              className="px-4 py-2 text-sm rounded-xl font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm"
            >
              {archiveLabel}
            </button>
          )}

          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-sm rounded-xl font-semibold transition shadow-lg ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                : 'bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 shadow-[#cfa851]/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
