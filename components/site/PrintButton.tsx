'use client';
export function PrintButton({ label }: { label: string }) {
  return <button type="button" className="btn btn-solid btn-sm" onClick={() => window.print()}>{label}</button>;
}
