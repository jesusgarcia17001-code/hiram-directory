import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "@/components/layout/PanelNav";

export const metadata: Metadata = {
  title: "Panel de Control",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Segunda capa de defensa en el servidor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const userData = {
    fullName: profile?.full_name || user.user_metadata?.full_name || "",
    email: user.email || "",
    role: profile?.role || "user",
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface-muted text-brand-text-primary">
      <PanelNav user={userData} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
