'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SettingsContextType = {
  taxRate: number;
  taxMethod: string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [taxRate, setTaxRate] = useState(18);
  const [taxMethod, setTaxMethod] = useState('Exclusive');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(json => {
        const ts = json?.data?.company?.taxSettings;
        if (ts) {
          setTaxRate(ts.defaultTaxRate ?? 18);
          setTaxMethod(ts.taxMethod ?? 'Exclusive');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ taxRate, taxMethod }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
