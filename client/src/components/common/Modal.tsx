import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export default function Modal({ open, onClose, title, children, width = "max-w-lg" }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${width} rounded-lg border border-gray-800 bg-gray-900 shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
          <button
            className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}