import React from "react";

export interface AlertProps {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  className = "",
}: AlertProps) {
  const variantStyles = {
    info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900",
    success:
      "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
    warning:
      "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900",
    error:
      "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900",
  };

  return (
    <div
      role="alert"
      className={`p-4 rounded-lg border text-sm text-left ${variantStyles[variant]} ${className}`}
    >
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
