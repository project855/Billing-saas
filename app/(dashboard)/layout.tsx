import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { LanguageProvider } from '@/lib/language-context';
import { SettingsProvider } from '@/lib/settings-context';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let themeColor = '#EF3A2A';
  let language = 'EN';

  if (session?.user?.id) {
    try {
      const companyId = await getOrCreateCompanyId(session.user.id, session.user?.email ?? undefined);
      const gs = await db.generalSettings.findUnique({ where: { companyId } });
      if (gs?.themeColor) themeColor = gs.themeColor;
      if (gs?.language) language = gs.language;
    } catch {}
  }

  // Calculate hex with opacity
  const hexToRgb = (hex: string) => {
    // defaults to EF3A2A if mapping breaks
    const r = parseInt(hex.slice(1, 3), 16) || 239;
    const g = parseInt(hex.slice(3, 5), 16) || 58;
    const b = parseInt(hex.slice(5, 7), 16) || 42;
    return `${r}, ${g}, ${b}`;
  };
  const rgb = hexToRgb(themeColor);

  return (
    <LanguageProvider defaultLang={language}>
      <SettingsProvider>
        <div 
          className="flex bg-gray-50 min-h-screen"
          style={{
            '--brand': themeColor,
            '--brand-10': `rgba(${rgb}, 0.1)`,
            '--brand-20': `rgba(${rgb}, 0.2)`,
            '--brand-30': `rgba(${rgb}, 0.3)`,
          } as React.CSSProperties}
        >
          <Sidebar />
          <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
            <TopBar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SettingsProvider>
    </LanguageProvider>
  );
}
