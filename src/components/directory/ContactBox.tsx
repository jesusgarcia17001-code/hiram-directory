"use client";

import React, { useState, useTransition } from "react";
import { brand } from "@/config/brand";
import { revealContactAction } from "@/features/metrics/actions";
import type { RevealContactResult } from "@/services/metrics";

interface ContactBoxProps {
  professionalId: string;
  professionalName: string;
  categoryLabel: string;
  contactsEnabled: boolean;
}

export function ContactBox({
  professionalId,
  professionalName,
  categoryLabel,
  contactsEnabled: initialContactsEnabled,
}: ContactBoxProps) {
  const [isPending, startTransition] = useTransition();
  const [contactsEnabled, setContactsEnabled] = useState(initialContactsEnabled);
  const [contactResult, setContactResult] = useState<RevealContactResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequestContact = (channel: "whatsapp" | "call") => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await revealContactAction(professionalId, channel);

      if (!res.success) {
        if (res.data?.isQuotaExhausted) {
          setContactsEnabled(false);
        }
        setErrorMsg(res.error || "No fue posible obtener el contacto.");
        return;
      }

      if (res.data) {
        setContactResult(res.data);
        // Si es WhatsApp y hay URL, abrir en nueva pestaña
        if (channel === "whatsapp" && res.data.actionUrl) {
          window.open(res.data.actionUrl, "_blank", "noopener,noreferrer");
        }
      }
    });
  };

  return (
    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-4 sticky top-24">
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          Contacto Directo
        </span>
        <h3 className="text-base font-bold text-brand-text-primary pt-1">
          Solicitar presupuesto o servicio
        </h3>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Comunícate directamente con {professionalName} para consultar disponibilidad y tarifas en Anzoátegui.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-brand-surface-muted border border-brand-border space-y-3">
        <div className="flex items-center gap-2 text-xs text-brand-text-primary font-semibold">
          <span>🛡️</span>
          <span>Canales de Contacto Verificados</span>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 text-red-800 rounded-lg border border-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Si la cuota gratuita fue agotada */}
        {!contactsEnabled ? (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span> Perfil con cuota temporalmente restringida
            </p>
            <p className="text-[11px] leading-relaxed">
              Este profesional ha alcanzado el límite de contactos de su cuota gratuita. Los botones se reactivarán en cuanto active o renueve su suscripción.
            </p>
          </div>
        ) : contactResult ? (
          /* Si el contacto fue revelado por el servidor */
          <div className="space-y-3 pt-1 animate-in fade-in duration-300">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                {contactResult.channel === "whatsapp" ? "WhatsApp Oficial" : "Teléfono Directo"}
              </span>

              <p className="text-base font-bold text-emerald-950 font-mono tracking-wide">
                {contactResult.phone}
              </p>

              {contactResult.actionUrl && (
                <a
                  href={contactResult.actionUrl}
                  target={contactResult.channel === "whatsapp" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  {contactResult.channel === "whatsapp"
                    ? "Abrir conversación en WhatsApp"
                    : "Llamar ahora"}
                </a>
              )}
            </div>

            <p className="text-[10px] text-center text-brand-text-muted">
              Al comunicarte, menciona que viste su perfil en {brand.name}.
            </p>
          </div>
        ) : (
          /* Botones para solicitar contacto */
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRequestContact("whatsapp")}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>💬</span>
              <span>{isPending ? "Conectando..." : "Contactar por WhatsApp"}</span>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRequestContact("call")}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-brand-surface text-brand-text-primary hover:bg-brand-surface-muted border border-brand-border transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>📞</span>
              <span>{isPending ? "Obteniendo..." : "Llamar por teléfono"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-[11px] text-brand-text-muted space-y-1 pt-2 border-t border-brand-border">
        <p className="flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">✓</span> Trato directo sin comisiones por trabajo
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">✓</span> Especialista en {categoryLabel.toLowerCase()}
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">✓</span> Cobertura local verificada en Anzoátegui
        </p>
      </div>
    </div>
  );
}
