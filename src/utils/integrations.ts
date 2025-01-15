import { QuickBooks, Xero, SyncResult } from '../integrations/types'
import { IntegrationSettings } from '../shared/types/settings'
import { getIntegrationSettings } from '../database/integrationService'

interface IntegrationInstance {
  quickbooks: QuickBooks | null
  xero: Xero | null
}

interface SyncOptions {
  forceSync?: boolean
  syncItems?: string[]
  dryRun?: boolean
}

const integrations: IntegrationInstance = {
  quickbooks: null,
  xero: null,
}

/**
 * Configura as integrações com base nas configurações
 * @throws Error se a configuração falhar
 */
export async function setupIntegrations(): Promise<void> {
  try {
    const settings = await getIntegrationSettings()
    await setupQuickBooks(settings)
    await setupXero(settings)
  } catch (error) {
    console.error('Failed to setup integrations:', error)
    throw new Error('Failed to setup integrations')
  }
}

/**
 * Configura a integração com QuickBooks
 * @param settings Configurações de integração
 */
async function setupQuickBooks(settings: IntegrationSettings): Promise<void> {
  if (!settings.quickbooksEnabled) {
    integrations.quickbooks = null
    return
  }

  try {
    integrations.quickbooks = new QuickBooks({
      accessToken: settings.quickbooksAccessToken,
      refreshToken: settings.quickbooksRefreshToken,
      clientId: settings.quickbooksClientId,
      clientSecret: settings.quickbooksClientSecret,
      environment: settings.quickbooksEnvironment,
      realmId: settings.quickbooksRealmId,
    })

    await integrations.quickbooks.initialize()
  } catch (error) {
    console.error('Failed to setup QuickBooks:', error)
    throw new Error('Failed to setup QuickBooks integration')
  }
}

/**
 * Configura a integração com Xero
 * @param settings Configurações de integração
 */
async function setupXero(settings: IntegrationSettings): Promise<void> {
  if (!settings.xeroEnabled) {
    integrations.xero = null
    return
  }

  try {
    integrations.xero = new Xero({
      accessToken: settings.xeroAccessToken,
      refreshToken: settings.xeroRefreshToken,
      clientId: settings.xeroClientId,
      clientSecret: settings.xeroClientSecret,
      tenantId: settings.xeroTenantId,
    })

    await integrations.xero.initialize()
  } catch (error) {
    console.error('Failed to setup Xero:', error)
    throw new Error('Failed to setup Xero integration')
  }
}

/**
 * Sincroniza dados com QuickBooks
 * @param options Opções de sincronização
 * @returns Resultado da sincronização
 * @throws Error se a sincronização falhar
 */
export async function syncWithQuickBooks(options: SyncOptions = {}): Promise<SyncResult> {
  if (!integrations.quickbooks) {
    throw new Error('QuickBooks integration is not enabled')
  }

  try {
    if (await shouldRefreshToken(integrations.quickbooks)) {
      await integrations.quickbooks.refreshAccessToken()
    }

    const result = await integrations.quickbooks.sync({
      force: options.forceSync,
      items: options.syncItems,
      dryRun: options.dryRun,
    })

    return result
  } catch (error) {
    console.error('Failed to sync with QuickBooks:', error)
    throw new Error('Failed to sync with QuickBooks')
  }
}

/**
 * Sincroniza dados com Xero
 * @param options Opções de sincronização
 * @returns Resultado da sincronização
 * @throws Error se a sincronização falhar
 */
export async function syncWithXero(options: SyncOptions = {}): Promise<SyncResult> {
  if (!integrations.xero) {
    throw new Error('Xero integration is not enabled')
  }

  try {
    if (await shouldRefreshToken(integrations.xero)) {
      await integrations.xero.refreshAccessToken()
    }

    const result = await integrations.xero.sync({
      force: options.forceSync,
      items: options.syncItems,
      dryRun: options.dryRun,
    })

    return result
  } catch (error) {
    console.error('Failed to sync with Xero:', error)
    throw new Error('Failed to sync with Xero')
  }
}

/**
 * Verifica se um token de acesso precisa ser atualizado
 * @param integration Instância da integração
 * @returns true se o token precisar ser atualizado
 */
async function shouldRefreshToken(integration: QuickBooks | Xero): Promise<boolean> {
  try {
    const tokenInfo = await integration.getTokenInfo()
    const expiresAt = new Date(tokenInfo.expiresAt)
    const now = new Date()

    // Atualiza se faltar menos de 5 minutos para expirar
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000
  } catch (error) {
    console.error('Failed to check token expiration:', error)
    return true
  }
}

/**
 * Desconecta todas as integrações
 */
export async function disconnectIntegrations(): Promise<void> {
  try {
    if (integrations.quickbooks) {
      await integrations.quickbooks.disconnect()
      integrations.quickbooks = null
    }

    if (integrations.xero) {
      await integrations.xero.disconnect()
      integrations.xero = null
    }
  } catch (error) {
    console.error('Failed to disconnect integrations:', error)
    throw new Error('Failed to disconnect integrations')
  }
}

/**
 * Verifica o status das integrações
 * @returns Status de cada integração
 */
export function getIntegrationStatus(): Record<string, boolean> {
  return {
    quickbooks: integrations.quickbooks !== null,
    xero: integrations.xero !== null,
  }
}

// Desconecta integrações quando o aplicativo é fechado
process.on('exit', () => {
  disconnectIntegrations().catch(console.error)
})

export type { SyncOptions, SyncResult }
