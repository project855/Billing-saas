'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
