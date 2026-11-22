import React from "react";
import { getBillingStatus } from "@/services/billing";

export async function LaunchBanner() {
  try {
    const status = await getBillingStatus();

    if (!status.launchBannerEnabled || !status.launchBannerText) {
      return null;
    }

    return (
      <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-center text-xs sm:text-sm font-bold shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="shrink-0">🎉</span>
          <span className="truncate sm:overflow-visible">{status.launchBannerText}</span>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
