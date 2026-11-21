import React from "react";
import { getAdminCategories } from "@/services/categories";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const metadata = {
  title: "Gestión de Categorías | Administración",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCategoriasPage() {
  const categories = await getAdminCategories();

  return <CategoriesManager categories={categories} />;
}
