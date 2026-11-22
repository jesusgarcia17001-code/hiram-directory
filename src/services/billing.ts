import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface BillingStatus {
  billingEnabled: boolean;
  billingEnabledAt: string | null;
  launchBannerText: string | null;
  launchBannerEnabled: boolean;
}

/**
 * Consulta el estado actual de cobro y modo lanzamiento en el sistema.
 * Es pública y segura.
 */
export async function getBillingStatus(): Promise<BillingStatus> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_billing_status");

  if (error || !data) {
    return {
      billingEnabled: false,
      billingEnabledAt: null,
      launchBannerText: "¡Lanzamiento en Anzoátegui! Disfruta de perfiles y contactos 100% gratuitos por tiempo limitado.",
      launchBannerEnabled: true,
    };
  }

  const res = data as any;
  return {
    billingEnabled: Boolean(res.billing_enabled),
    billingEnabledAt: res.billing_enabled_at || null,
    launchBannerText: res.launch_banner_text || null,
    launchBannerEnabled: Boolean(res.launch_banner_enabled),
  };
}
