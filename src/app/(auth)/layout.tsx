import React from "react";
import Link from "next/link";
import Image from "next/image";
import { brand } from "@/config/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-surface-muted">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-brand-primary-hover transition-colors">
            {brand.shortName.charAt(0)}
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-brand-text-primary">
            {brand.name}
          </span>
        </Link>
        <p className="mt-2 text-xs text-brand-text-muted">
          {brand.coverage.state} ({brand.coverage.primaryCities.join(", ")})
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-brand-surface py-8 px-6 shadow-sm border border-brand-border rounded-2xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
