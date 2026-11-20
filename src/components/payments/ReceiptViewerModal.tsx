"use client";

import React, { useState, useTransition } from "react";
import { getReceiptUrlAction } from "@/features/payments/actions";

interface ReceiptViewerButtonProps {
  storagePath: string;
  buttonLabel?: string;
  variant?: "primary" | "secondary" | "subtle";
}

export function ReceiptViewerButton({
  storagePath,
  buttonLabel = "Ver Comprobante",
  variant = "subtle",
}: ReceiptViewerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setError(null);
    startTransition(async () => {
      const url = await getReceiptUrlAction(storagePath);
      if (url) {
        setSignedUrl(url);
        setIsOpen(true);
      } else {
        setError("No se pudo generar el enlace seguro para ver el comprobante.");
      }
    });
  };

  const isPdf = storagePath.toLowerCase().endsWith(".pdf");

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
          variant === "primary"
            ? "bg-brand-primary text-white hover:bg-brand-primary-hover"
            : variant === "secondary"
            ? "bg-slate-800 text-white hover:bg-slate-700"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
        } disabled:opacity-50`}
      >
        {isPending ? (
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <span>🧾</span>
        )}
        {buttonLabel}
      </button>

      {error && <span className="text-[11px] text-red-600 block mt-1">{error}</span>}

      {/* Modal */}
      {isOpen && signedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-brand-surface rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-brand-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <h3 className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                <span>🧾</span> Comprobante de Pago Privado
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-primary hover:underline px-2 py-1"
                >
                  Abrir en pestaña nueva ↗
                </a>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-50">
              {isPdf ? (
                <iframe
                  src={signedUrl}
                  className="w-full h-96 rounded-lg border border-slate-200"
                  title="Comprobante PDF"
                />
              ) : (
                <img
                  src={signedUrl}
                  alt="Comprobante de pago"
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>

            <div className="p-3 bg-brand-surface-muted border-t border-brand-border text-center text-xs text-brand-text-muted">
              🔒 Enlace temporal de alta seguridad firmado por el servidor (expira en 5 minutos).
            </div>
          </div>
        </div>
      )}
    </>
  );
}
