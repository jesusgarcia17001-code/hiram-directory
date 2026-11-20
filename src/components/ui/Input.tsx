import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = "", ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-brand-text-primary"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-brand-text-primary placeholder:text-brand-text-muted bg-brand-surface transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            error
              ? "border-brand-danger focus:ring-brand-danger"
              : "border-brand-border"
          } ${className}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-brand-danger">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-brand-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
