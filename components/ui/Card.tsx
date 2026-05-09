
import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-sm md:p-5">
      {children}
    </div>
  );
}
