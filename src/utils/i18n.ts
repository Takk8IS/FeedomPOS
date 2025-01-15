import i18n from 'i18next'
import { InitOptions } from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

interface TranslationKeys {
  welcome: string
  sales: string
  inventory: string
  reports: string
  settings: string
  customers: string
  products: string
  logout: string
}

type Resources = {
  [key: string]: {
    translation: TranslationKeys
  }
}

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
}

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
}

/**
 * Inicializa o sistema de internacionalização
 * @returns Promise que resolve quando a inicialização estiver completa
 */
export async function setupI18n(): Promise<typeof i18n> {
  try {
    await i18n.use(Backend).use(LanguageDetector).use(initReactI18next).init(i18nConfig)

    return i18n
  } catch (error) {
    console.error('Failed to initialize i18n:', error)
    throw new Error('Failed to initialize internationalization')
  }
}

/**
 * Muda o idioma atual
 * @param language Código do idioma (ex: 'en', 'es', 'pt')
 * @returns Promise que resolve quando a mudança estiver completa
 */
export async function changeLanguage(language: string): Promise<void> {
  try {
    await i18n.changeLanguage(language)
  } catch (error) {
    console.error(`Failed to change language to ${language}:`, error)
    throw new Error(`Failed to change language to ${language}`)
  }
}

/**
 * Obtém o idioma atual
 * @returns Código do idioma atual
 */
export function getCurrentLanguage(): string {
  return i18n.language
}

/**
 * Verifica se um idioma está disponível
 * @param language Código do idioma
 * @returns true se o idioma estiver disponível
 */
export function isLanguageAvailable(language: string): boolean {
  return Object.keys(resources).includes(language)
}

/**
 * Obtém todos os idiomas disponíveis
 * @returns Array com os códigos dos idiomas disponíveis
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(resources)
}

/**
 * Adiciona uma nova tradução
 * @param language Código do idioma
 * @param namespace Namespace da tradução
 * @param translations Objeto com as traduções
 */
export function addTranslations(
  language: string,
  namespace: string,
  translations: Record<string, string>
): void {
  i18n.addResourceBundle(language, namespace, translations, true, true)
}

// Exporta a instância i18n para uso em componentes React
export default i18n

// Tipos de exportação para uso em outros arquivos
export type { TranslationKeys }
