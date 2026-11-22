import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Identificador oficial del Banco Central de Venezuela en CotizaVE v2
const BCV_RATE_ID = "ve-bcv";

/**
 * Comparación en tiempo constante para evitar ataques de timing en CRON_SECRET.
 */
function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // 1. Verificación estricta de autorización con CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET no está configurado en las variables de entorno.");
    return NextResponse.json(
      { error: "No configurado" },
      { status: 401 }
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const expectedHeader = `Bearer ${cronSecret}`;

  if (!secureCompare(authHeader, expectedHeader)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  // 2. Verificación de clave de CotizaVE
  const apiKey = process.env.COTIZAVE_API_KEY;
  if (!apiKey) {
    console.error("[CRON] COTIZAVE_API_KEY no está configurada.");
    return NextResponse.json(
      { error: "Servicio de tasa no disponible" },
      { status: 500 }
    );
  }

  const adminClient = createAdminClient();

  try {
    // 3. Llamada al endpoint externo con timeout de 10 segundos
    const response = await fetch("https://api.cotizave.com/v2/fx/VE/rates", {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[CRON] CotizaVE respondió con HTTP ${response.status}`);
      return NextResponse.json(
        {
          success: false,
          error: "Error al consultar proveedor de tasas",
          fallback_preserved: true,
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const rates: any[] = Array.isArray(payload)
      ? payload
      : payload?.rates || payload?.data || [];

    // 4. Buscar el elemento del BCV por su id oficial
    const bcvItem = rates.find((r) => r.id === BCV_RATE_ID);

    if (!bcvItem) {
      console.error(`[CRON] Elemento '${BCV_RATE_ID}' no encontrado en la respuesta de CotizaVE`);
      return NextResponse.json(
        {
          success: false,
          error: "Tasa BCV no encontrada en la respuesta",
          fallback_preserved: true,
        },
        { status: 502 }
      );
    }

    const rateValue = Number(bcvItem.mid);
    if (!Number.isFinite(rateValue) || rateValue <= 0) {
      console.error(`[CRON] Valor de tasa inválido recibido: ${bcvItem.mid}`);
      return NextResponse.json(
        {
          success: false,
          error: "Valor de tasa inválido recibido",
          fallback_preserved: true,
        },
        { status: 502 }
      );
    }

    const sourceUpdatedAt = bcvItem.updated_at
      ? new Date(bcvItem.updated_at).toISOString()
      : new Date().toISOString();

    // 5. Consultar tasa activa actual para evaluar variación
    const { data: currentActive } = await adminClient
      .from("exchange_rates")
      .select("id, rate")
      .eq("currency_pair", "USD_VES")
      .eq("is_active", true)
      .maybeSingle();

    let variationPercentage: number | null = null;
    let isVariationHigh = false;

    if (currentActive?.rate) {
      const currentRate = Number(currentActive.rate);
      variationPercentage = Math.abs((rateValue - currentRate) / currentRate) * 100;

      // Si cambia más de 15%, no activarla automáticamente
      if (variationPercentage > 15) {
        isVariationHigh = true;
      }
    }

    if (isVariationHigh) {
      console.warn(
        `[CRON] Variación de tasa alta detectada (${variationPercentage?.toFixed(2)}%). Guardando como pendiente de revisión.`
      );

      const { data: pendingInsert, error: pendingErr } = await adminClient
        .from("exchange_rates")
        .insert({
          currency_pair: "USD_VES",
          rate: rateValue,
          source: "cotizave",
          source_updated_at: sourceUpdatedAt,
          is_active: false,
          status: "pending_approval",
          variation_percentage: variationPercentage,
          metadata: {
            bcv_id: bcvItem.id,
            market: bcvItem.market,
            type: bcvItem.type,
          },
        })
        .select("id")
        .single();

      if (pendingErr) {
        throw pendingErr;
      }

      return NextResponse.json({
        success: true,
        status: "pending_approval",
        rate: rateValue,
        variation_percentage: variationPercentage,
        message: "Tasa registrada como pendiente por variación mayor al 15%",
      });
    }

    // 6. Activar la nueva tasa automáticamente:
    // Desactivar la tasa activa previa
    await adminClient
      .from("exchange_rates")
      .update({ is_active: false, status: "superseded" })
      .eq("currency_pair", "USD_VES")
      .eq("is_active", true);

    // Insertar la nueva tasa activa
    const { data: newRate, error: insertErr } = await adminClient
      .from("exchange_rates")
      .insert({
        currency_pair: "USD_VES",
        rate: rateValue,
        source: "cotizave",
        source_updated_at: sourceUpdatedAt,
        is_active: true,
        status: "active",
        variation_percentage: variationPercentage,
        metadata: {
          bcv_id: bcvItem.id,
          market: bcvItem.market,
          type: bcvItem.type,
        },
      })
      .select("id, rate, source_updated_at")
      .single();

    if (insertErr) {
      throw insertErr;
    }

    return NextResponse.json({
      success: true,
      status: "active",
      rate: newRate.rate,
      source_updated_at: newRate.source_updated_at,
    });
  } catch (err: any) {
    console.error("[CRON] Excepción al actualizar tasa:", err?.message || err);
    // En caso de fallo, la última tasa activa se conserva intacta
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al procesar la tasa",
        fallback_preserved: true,
      },
      { status: 500 }
    );
  }
}
