import i18n from 'i18next';
import { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export interface TranslationKeys {
  welcome: string;
  sales: string;
  inventory: string;
  reports: string;
  settings: string;
  customers: string;
  products: string;
  logout: string;
  // Add more translation keys as needed
}

type Resources = {
  [key: string]: {
    translation: TranslationKeys;
  };
};

const resources: Resources = {
  en: {
    translation: {
      welcome: 'Welcome to FreedomPOS',
      sales: 'Sales',
      inventory: 'Inventory',
      reports: 'Reports',
      settings: 'Settings',
      customers: 'Customers',
      products: 'Products',
      logout: 'Logout',
    },
  },
  es: {
    translation: {
      welcome: 'Bienvenido a FreedomPOS',
      sales: 'Ventas',
      inventory: 'Inventario',
      reports: 'Reportes',
      settings: 'Configuración',
      customers: 'Clientes',
      products: 'Productos',
      logout: 'Cerrar Sesión',
    },
  },
  pt: {
    translation: {
      welcome: 'Bem-vindo ao FreedomPOS',
      sales: 'Vendas',
      inventory: 'Estoque',
      reports: 'Relatórios',
      settings: 'Configurações',
      customers: 'Clientes',
      products: 'Produtos',
      logout: 'Sair',
    },
  },
};

const i18nConfig: InitOptions = {
  resources,
  fallbackLng: 'en',
  defaultNS: 'translation',
  fallbackNS: 'translation',
  debug: process.env.NODE_ENV === 'development',

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: true,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
  },

  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'i18nextLng',
  },

  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/{{lng}}/{{ns}}.missing.json',
  },
};

/**
 * Initializes the internationalization system
 * @returns Promise that resolves when the initialization is complete
 */
export async function setupI18n(): Promise<typeof i18n> {
  try {
    await i18n.use(Backend).use(LanguageDetector).use(initReactI18next).init(i18nConfig);

    return i18n;
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    throw new Error('Failed to initialize internationalization');
  }
}

/**
 * Changes the current language
 * @param language Language code (e.g., 'en', 'es', 'pt')
 * @returns Promise that resolves when the change is complete
 */
export async function changeLanguage(language: string): Promise<void> {
  if (!isLanguageAvailable(language)) {
    throw new Error(`Language ${language} is not available`);
  }

  try {
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error(`Failed to change language to ${language}:`, error);
    throw new Error(`Failed to change language to ${language}`);
  }
}

/**
 * Gets the current language
 * @returns Current language code
 */
export function getCurrentLanguage(): string {
  return i18n.language;
}

/**
 * Checks if a language is available
 * @param language Language code
 * @returns true if the language is available
 */
export function isLanguageAvailable(language: string): boolean {
  return Object.keys(resources).includes(language);
}

/**
 * Gets all available languages
 * @returns Array of available language codes
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(resources);
}

/**
 * Adds new translations
 * @param language Language code
 * @param namespace Translation namespace
 * @param translations Object with translations
 */
export function addTranslations(
  language: string,
  namespace: string,
  translations: Partial<TranslationKeys>,
): void {
  i18n.addResourceBundle(language, namespace, translations, true, true);
}

/**
 * Gets a translation for a given key
 * @param key Translation key
 * @param options Translation options
 * @returns Translated string
 */
export function translate(key: keyof TranslationKeys, options?: object): string {
  return i18n.t(key, options);
}

// Export the i18n instance for use in React components
export default i18n;

// Type exports for use in other files
export type { TranslationKeys };
