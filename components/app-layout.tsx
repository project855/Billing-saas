'use client';

import { ReactNode } from 'react';


export function AppLayout({ children }: { children: ReactNode }) {
  // Navigation layout is now centrally managed by app/(dashboard)/layout.tsx
  return <>{children}</>;
}
