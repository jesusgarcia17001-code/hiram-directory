"use client";

import React, { useActionState } from "react";
import { savePaymentSettingsAction, ActionResult } from "../actions-payment-settings";
import { PaymentSettingsItem } from "@/services/payments";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface Props {
  initialSettings: PaymentSettingsItem | null;
}

export function PaymentSettingsForm({ initialSettings }: Props) {
  const [state, formAction, isPending] = useActionState(savePaymentSettingsAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.message && (
        <Alert variant={state.success ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre del Banco *"
          name="bank_name"
          defaultValue={initialSettings?.bank_name || "Banco Mercantil"}
          placeholder="Ej: Banco Mercantil, Banesco, etc."
          required
          error={state?.errors?.bank_name?.[0]}
        />

        <Input
          label="Código de Banco (4 dígitos) *"
          name="bank_code"
          defaultValue={initialSettings?.bank_code || "0105"}
          placeholder="Ej: 0105"
          maxLength={4}
          required
          error={state?.errors?.bank_code?.[0]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tipo Documento *
          </label>
          <select
            name="id_type"
            defaultValue={initialSettings?.id_type || "J"}
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="J">J - Jurídico (RIF)</option>
            <option value="V">V - Venezolano (Cédula)</option>
            <option value="E">E - Extranjero</option>
            <option value="G">G - Gubernamental</option>
          </select>
          {state?.errors?.id_type && (
            <p className="text-xs text-red-400 mt-1">{state.errors.id_type[0]}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Número de Cédula o RIF *"
            name="id_number"
            defaultValue={initialSettings?.id_number || ""}
            placeholder="Ej: 12345678 o 500123450"
            required
            error={state?.errors?.id_number?.[0]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Teléfono de Pago Móvil *"
          name="phone"
          defaultValue={initialSettings?.phone || ""}
          placeholder="Ej: 04141234567"
          required
          error={state?.errors?.phone?.[0]}
        />

        <Input
          label="Nombre o Razón Social del Titular *"
          name="account_holder"
          defaultValue={initialSettings?.account_holder || ""}
          placeholder="Ej: HIRAM Servicios C.A."
          required
          error={state?.errors?.account_holder?.[0]}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Instrucciones para el Profesional
        </label>
        <textarea
          name="instructions"
          defaultValue={
            initialSettings?.instructions ||
            "Por favor realiza el Pago Móvil por el monto exacto en Bolívares y adjunta la captura con el número de referencia legible."
          }
          rows={3}
          className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        />
        {state?.errors?.instructions && (
          <p className="text-xs text-red-400 mt-1">{state.errors.instructions[0]}</p>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
          Guardar Ajustes de Pago Móvil
        </Button>
      </div>
    </form>
  );
}
