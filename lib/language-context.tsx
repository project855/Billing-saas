'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Core Dictionary
const DICTIONARY: Record<string, Record<string, string>> = {
  'EN': {
    'nav.dashboard': 'Dashboard',
    'nav.customers': 'Customers',
    'nav.items': 'Items',
    'nav.invoices': 'Invoices',
    'nav.payments': 'Payments',
    'nav.expenses': 'Expenses',
    'nav.catalog': 'Product Catalog',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    
    'dash.revenue': 'Total Revenue',
    'dash.outstanding': 'Outstanding',
    'dash.overdue': 'Overdue',
    'dash.active_clients': 'Active Clients',
    'dash.recent_activity': 'Recent Activity',
    'dash.pending_invoices': 'Pending Invoices',
    'dash.view_all': 'View All',
    'dash.no_activity': 'No recent activity yet.',
    'dash.no_pending': 'No pending invoices.',
    'dash.from_last_month': 'from last month',
    'dash.open_invoices': 'open invoices',
    'dash.this_month': 'this month',
    
    'top.search': 'Search invoices, customers…',
    'top.quick': 'Quick Add',
    'top.create': 'Create New',
    'top.settings': 'Settings',
    'top.logout': 'Sign Out',
    'quick.inv': 'New Invoice',
    'quick.inv_desc': 'Create and send an invoice',
    'quick.cus': 'New Customer',
    'quick.cus_desc': 'Add a new client or contact',
    'quick.item': 'New Item',
    'quick.item_desc': 'Add product or service',
    'quick.exp': 'New Expense',
    'quick.exp_desc': 'Log a business expense',
    'help.title': 'Help & Support',
    'help.docs': 'Documentation',
    'help.docs_desc': 'Read the user guides',
    'help.contact': 'Contact Support',
    'help.contact_desc': 'Send us a message',
    'help.shortcuts': 'Keyboard Shortcuts',
    'help.shortcuts_desc': 'Work faster with hotkeys',
    'top.notifications': 'Notifications',
    'top.mark_read': 'Mark all read',
    'top.view_all_notifs': 'View all Activity',
  },
  'TA': {
    'nav.dashboard': 'முகப்பு (Dashboard)',
    'nav.customers': 'வாடிக்கையாளர்கள் (Customers)',
    'nav.items': 'பொருட்கள் (Items)',
    'nav.invoices': 'விலைப்பட்டியல்கள் (Invoices)',
    'nav.payments': 'கட்டணங்கள் (Payments)',
    'nav.expenses': 'செலவுகள் (Expenses)',
    'nav.catalog': 'தயாரிப்பு பட்டியல் (Catalog)',
    'nav.reports': 'அறிக்கைகள் (Reports)',
    'nav.settings': 'அமைப்புகள் (Settings)',
    
    'dash.revenue': 'மொத்த வருவாய் (Revenue)',
    'dash.outstanding': 'நிலுவை (Outstanding)',
    'dash.overdue': 'காலதாமதம் (Overdue)',
    'dash.active_clients': 'செயலில் உள்ள வாடிக்கையாளர்கள்',
    'dash.recent_activity': 'சமீபத்திய செயல்பாடுகள்',
    'dash.pending_invoices': 'நிலுவையில் உள்ள விலைப்பட்டியல்கள்',
    'dash.view_all': 'அனைத்தையும் காண்க',
    'dash.no_activity': 'சமீபத்திய செயல்பாடுகள் இல்லை.',
    'dash.no_pending': 'நிலுவை விலைப்பட்டியல்கள் இல்லை.',
    'dash.from_last_month': 'கடந்த மாதத்திலிருந்து',
    'dash.open_invoices': 'திறந்த விலைப்பட்டியல்கள்',
    'dash.this_month': 'இந்த மாதம்',
    
    'top.search': 'விலைப்பட்டியல்கள், வாடிக்கையாளர்களைத் தேடுங்கள்…',
    'top.quick': 'விரைவாக சேர்',
    'top.create': 'புதியதை உருவாக்கு',
    'top.settings': 'அமைப்புகள்',
    'top.logout': 'வெளியேறு',
    'quick.inv': 'புதிய விலைப்பட்டியல்',
    'quick.inv_desc': 'விலைப்பட்டியலை உருவாக்கவும்',
    'quick.cus': 'புதிய வாடிக்கையாளர்',
    'quick.cus_desc': 'வாடிக்கையாளரைச் சேர்க்கவும்',
    'quick.item': 'புதிய பொருள்',
    'quick.item_desc': 'பொருளைச் சேர்க்கவும்',
    'quick.exp': 'புதிய செலவு',
    'quick.exp_desc': 'செலவைப் பதிவு செய்க',
    'help.title': 'உதவி மற்றும் ஆதரவு',
    'help.docs': 'ஆவணங்கள்',
    'help.docs_desc': 'பயனர் வழிகாட்டிகளைப் படிக்கவும்',
    'help.contact': 'ஆதரவை தொடர்பு கொள்ள',
    'help.contact_desc': 'எங்களுக்கு ஒரு செய்தி அனுப்பவும்',
    'help.shortcuts': 'விசைப்பலகை சுருக்குவழிகள்',
    'help.shortcuts_desc': 'விரைவாக வேலை செய்ய',
    'top.notifications': 'அறிவிப்புகள்',
    'top.mark_read': 'அனைத்தையும் படிக்கவும்',
    'top.view_all_notifs': 'அனைத்து செயல்பாடுகளையும் காண்க',
  },
  'HI': {
    'nav.dashboard': 'डैशबोर्ड (Dashboard)',
    'nav.customers': 'ग्राहक (Customers)',
    'nav.items': 'सामग्री (Items)',
    'nav.invoices': 'चालान (Invoices)',
    'nav.payments': 'भुगतान (Payments)',
    'nav.expenses': 'खर्च (Expenses)',
    'nav.catalog': 'उत्पाद सूची (Catalog)',
    'nav.reports': 'रिपोर्ट (Reports)',
    'nav.settings': 'सेटिंग्स (Settings)',
    
    'dash.revenue': 'कुल आय (Total Revenue)',
    'dash.outstanding': 'बकाया (Outstanding)',
    'dash.overdue': 'अतिदेय (Overdue)',
    'dash.active_clients': 'सक्रिय ग्राहक',
    'dash.recent_activity': 'हाल की गतिविधि',
    'dash.pending_invoices': 'लंबित चालान',
    'dash.view_all': 'सभी देखें',
    'dash.no_activity': 'हाल में कोई गतिविधि नहीं।',
    'dash.no_pending': 'कोई लंबित चालान नहीं।',
    'dash.from_last_month': 'पिछले महीने से',
    'dash.open_invoices': 'खुले चालान',
    'dash.this_month': 'इस महीने',
    
    'top.search': 'चालान, ग्राहकों को खोजें...',
    'top.quick': 'त्वरित जोड़ें',
    'top.create': 'नया बनाएँ',
    'top.settings': 'सेटिंग्स',
    'top.logout': 'बाहर जाएं',
    'quick.inv': 'नया चालान',
    'quick.inv_desc': 'नया चालान बनाएं',
    'quick.cus': 'नया ग्राहक',
    'quick.cus_desc': 'ग्राहक जोड़ें',
    'quick.item': 'नई सामग्री',
    'quick.item_desc': 'उत्पाद जोड़ें',
    'quick.exp': 'नया खर्च',
    'quick.exp_desc': 'खर्च दर्ज करें',
    'help.title': 'सहायता और समर्थन',
    'help.docs': 'दस्तावेज़ीकरण',
    'help.docs_desc': 'उपयोगकर्ता मार्गदर्शिका पढ़ें',
    'help.contact': 'समर्थन से संपर्क करें',
    'help.contact_desc': 'हमें एक संदेश भेजें',
    'help.shortcuts': 'कीबोर्ड शॉर्टकट',
    'help.shortcuts_desc': 'तेजी से काम करें',
    'top.notifications': 'सूचनाएं',
    'top.mark_read': 'सभी को पढ़ा हुआ मानें',
    'top.view_all_notifs': 'सभी गतिविधियाँ देखें',
  }
};

export function LanguageProvider({ children, defaultLang = 'EN' }: { children: React.ReactNode, defaultLang?: string }) {
  const [language, setLanguage] = useState(defaultLang);

  useEffect(() => {
    // Sync if server changes or local storage is missing
    setLanguage(defaultLang);
  }, [defaultLang]);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
  };

  const t = (key: string) => {
    return DICTIONARY[language]?.[key] || DICTIONARY['EN'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
