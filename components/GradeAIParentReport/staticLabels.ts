/**
 * MINIMAL STATIC LABELS
 * 
 * These are ONLY for UI elements that must appear instantly
 * without waiting for AI translation.
 * 
 * Keep this as small as possible - let AI handle the rest!
 */

import { LanguageCode } from './LanguageContext'

export interface StaticLabels {
  loading: string
  translating: string
  error: string
  retry: string
  print: string
  download: string
  share: string
  close: string
  language: string
  expand: string
  collapse: string
}

export const staticLabels: Record<LanguageCode, StaticLabels> = {
  de: {
    loading: 'Wird geladen...',
    translating: 'Übersetze...',
    error: 'Fehler',
    retry: 'Erneut versuchen',
    print: 'Drucken',
    download: 'Herunterladen',
    share: 'Teilen',
    close: 'Schließen',
    language: 'Sprache',
    expand: 'Erweitern',
    collapse: 'Einklappen',
  },
  en: {
    loading: 'Loading...',
    translating: 'Translating...',
    error: 'Error',
    retry: 'Retry',
    print: 'Print',
    download: 'Download',
    share: 'Share',
    close: 'Close',
    language: 'Language',
    expand: 'Expand',
    collapse: 'Collapse',
  },
  tr: {
    loading: 'Yükleniyor...',
    translating: 'Çevriliyor...',
    error: 'Hata',
    retry: 'Tekrar dene',
    print: 'Yazdır',
    download: 'İndir',
    share: 'Paylaş',
    close: 'Kapat',
    language: 'Dil',
    expand: 'Genişlet',
    collapse: 'Daralt',
  },
  ar: {
    loading: '...جاري التحميل',
    translating: '...جاري الترجمة',
    error: 'خطأ',
    retry: 'إعادة المحاولة',
    print: 'طباعة',
    download: 'تحميل',
    share: 'مشاركة',
    close: 'إغلاق',
    language: 'اللغة',
    expand: 'توسيع',
    collapse: 'طي',
  },
  fa: {
    loading: '...در حال بارگذاری',
    translating: '...در حال ترجمه',
    error: 'خطا',
    retry: 'تلاش مجدد',
    print: 'چاپ',
    download: 'دانلود',
    share: 'اشتراک‌گذاری',
    close: 'بستن',
    language: 'زبان',
    expand: 'گسترش',
    collapse: 'جمع کردن',
  },
  ku: {
    loading: '...چاوەڕوان بە',
    translating: '...وەرگێڕان',
    error: 'هەڵە',
    retry: 'دووبارە هەوڵبدە',
    print: 'چاپکردن',
    download: 'داگرتن',
    share: 'هاوبەشکردن',
    close: 'داخستن',
    language: 'زمان',
    expand: 'فراوانکردن',
    collapse: 'کۆکردنەوە',
  },
  kmr: {
    loading: 'Tê barkirin...',
    translating: 'Tê wergerandin...',
    error: 'Çewtî',
    retry: 'Dîsa biceribîne',
    print: 'Çapkirin',
    download: 'Daxistin',
    share: 'Parvekirinî',
    close: 'Girtin',
    language: 'Ziman',
    expand: 'Berfirehkirin',
    collapse: 'Hûrbûn',
  },
  ru: {
    loading: 'Загрузка...',
    translating: 'Перевод...',
    error: 'Ошибка',
    retry: 'Повторить',
    print: 'Печать',
    download: 'Скачать',
    share: 'Поделиться',
    close: 'Закрыть',
    language: 'Язык',
    expand: 'Развернуть',
    collapse: 'Свернуть',
  },
  ro: {
    loading: 'Se încarcă...',
    translating: 'Se traduce...',
    error: 'Eroare',
    retry: 'Reîncercă',
    print: 'Tipărește',
    download: 'Descarcă',
    share: 'Distribuie',
    close: 'Închide',
    language: 'Limbă',
    expand: 'Extinde',
    collapse: 'Restrânge',
  },
}

export const getStaticLabel = (language: LanguageCode, key: keyof StaticLabels): string => {
  return staticLabels[language]?.[key] || staticLabels.en[key] || key
}
