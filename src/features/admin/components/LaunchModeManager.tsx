"use client";

import React, { useState, useActionState } from "react";
import { setBillingEnabledAction } from "../actions-billing";
import { BillingStatus } from "@/services/billing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface Props {
  initialStatus: BillingStatus;
}

export function LaunchModeManager({ initialStatus }: Props) {
  const [state, formAction, isPending] = useActionState(setBillingEnabledAction, null);
  const [showConfirmActivate, setShowConfirmActivate] = useState(false);
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [bannerText, setBannerText] = useState(
    initialStatus.launchBannerText ||
      "¡Estamos en lanzamiento! Todos los contactos y perfiles son 100% gratuitos por tiempo limitado."
  );
  const [bannerEnabled, setBannerEnabled] = useState(initialStatus.launchBannerEnabled);

  const isBillingActive = initialStatus.billingEnabled;

  return (
    <div className="space-y-6">
      {state?.message && (
        <Alert variant={state.success ? "success" : "error"}>{state.message}</Alert>
      )}

      {/* ESTADO ACTUAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estado de Cobro de la Plataforma
            </span>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  isBillingActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {isBillingActive ? "Cobro Activo (Normal)" : "Modo Lanzamiento Gratuito Activo"}
              </span>
              {initialStatus.billingEnabledAt && isBillingActive && (
                <span className="text-xs text-slate-400">
                  Activo desde:{" "}
                  {new Date(initialStatus.billingEnabledAt).toLocaleDateString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
              {isBillingActive
                ? "El cobro está en funcionamiento. Se aplican las cuotas gratuitas (10 visitas o 5 contactos únicos) y los profesionales con cuota agotada deben pagar una suscripción para mantener WhatsApp y llamadas visibles."
                : "La plataforma está en fase de lanzamiento. Todos los técnicos aprobados tienen sus botones de contacto activos sin límite ni costo. El formulario de pago está deshabilitado para evitar confusiones."}
            </p>
          </div>

          <div className="shrink-0">
            {!isBillingActive ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setShowConfirmActivate(true);
                  setShowConfirmDeactivate(false);
                }}
              >
                Activar Cobro
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => {
                  setShowConfirmDeactivate(true);
                  setShowConfirmActivate(false);
                }}
              >
                Volver a Modo Lanzamiento
              </Button>
            )}
          </div>
        </div>

        {/* MODAL / SECCIÓN DE CONFIRMACIÓN PARA ACTIVAR COBRO */}
        {showConfirmActivate && !isBillingActive && (
          <form
            action={formAction}
            className="mt-6 pt-6 border-t border-slate-800 bg-amber-950/20 rounded-xl p-5 border border-amber-500/30"
          >
            <input type="hidden" name="enabled" value="true" />
            <input type="hidden" name="banner_text" value={bannerText} />
            <input type="hidden" name="banner_enabled" value={bannerEnabled ? "true" : "false"} />

            <h4 className="text-base font-bold text-amber-300">
              Confirmación de Activación de Cobro
            </h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Al activar el cobro, comenzarán a regir las cuotas gratuitas y las suscripciones. Las
              visitas y contactos acumulados durante el lanzamiento <strong>NO</strong> se cuentan
              para la cuota gratuita (inician en 0 a partir de hoy).
            </p>
            <p className="mt-2 text-xs font-semibold text-amber-200">
              Para confirmar, escribe la palabra <span className="underline font-mono">ACTIVAR</span>{" "}
              en el recuadro:
            </p>

            <div className="mt-3 max-w-xs">
              <Input
                name="confirmation"
                placeholder="ACTIVAR"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                required
                error={state?.errors?.confirmation?.[0]}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || confirmationInput !== "ACTIVAR"}
              >
                {isPending ? "Activando..." : "Confirmar y Activar Cobro"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowConfirmActivate(false);
                  setConfirmationInput("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* CONFIRMACIÓN PARA DESACTIVAR COBRO (MODO LANZAMIENTO) */}
        {showConfirmDeactivate && isBillingActive && (
          <form
            action={formAction}
            className="mt-6 pt-6 border-t border-slate-800 bg-slate-950 rounded-xl p-5 border border-slate-700"
          >
            <input type="hidden" name="enabled" value="false" />
            <input type="hidden" name="banner_text" value={bannerText} />
            <input type="hidden" name="banner_enabled" value={bannerEnabled ? "true" : "false"} />

            <h4 className="text-base font-bold text-white">
              Volver a Modo Lanzamiento Gratuito
            </h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Los contactos volverán a ser gratuitos e ilimitados para todos los profesionales
              aprobados. No se aceptarán nuevos pagos mientras el modo lanzamiento esté activo.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                className="bg-amber-600 hover:bg-amber-500"
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Sí, pasar a Modo Lanzamiento"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowConfirmDeactivate(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* AJUSTES DEL BANNER INFORMATIVO */}
      <form action={formAction} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <input type="hidden" name="enabled" value={isBillingActive ? "true" : "false"} />

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Banner Informativo de Lanzamiento
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Puedes mostrar un aviso en la parte superior del directorio para anunciar promociones o
            la gratuidad del servicio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="banner_enabled_checkbox"
            name="banner_enabled"
            value="true"
            checked={bannerEnabled}
            onChange={(e) => setBannerEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20"
          />
          <label htmlFor="banner_enabled_checkbox" className="text-sm text-slate-200 cursor-pointer">
            Mostrar banner informativo a los visitantes
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Texto del Banner
          </label>
          <textarea
            name="banner_text"
            rows={2}
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
            placeholder="Ej: ¡Estamos en lanzamiento! Todos los contactos son 100% gratuitos."
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Banner"}
          </Button>
        </div>
      </form>
    </div>
  );
}
