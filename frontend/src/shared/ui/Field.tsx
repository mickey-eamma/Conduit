import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}

export function ReadOnlyField({ label, value, sub }: ReadOnlyFieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="ro">
        {value}
        {sub && <span className="ro-sub">{sub}</span>}
      </div>
    </div>
  );
}
