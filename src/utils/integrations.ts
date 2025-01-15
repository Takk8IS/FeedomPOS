import { QuickBooks, Xero, SyncResult, TokenInfo } from '../integrations/types';
import { IntegrationSettings } from '../shared/types/settings';
import { getIntegrationSettings, updateIntegrationSettings } from '../database/integrationService';

interface IntegrationInstance {
  quickbooks: QuickBooks | null;
  xero: Xero | null;
}

export interface SyncOptions {
  forceSync?: boolean;
  syncItems?: string[];
  dryRun?: boolean;
}

const integrations: IntegrationInstance = {
  quickbooks: null,
  xero: null,
};

/**
 * Sets up integrations based on settings
 * @throws Error if setup fails
 */
export async function setupIntegrations(): Promise<void> {
  try {
    const settings = await getIntegrationSettings();
    await Promise.all([setupQuickBooks(settings), setupXero(settings)]);
  } catch (error) {
    console.error('Failed to setup integrations:', error);
    throw new Error('Failed to setup integrations');
  }
}

/**
 * Sets up QuickBooks integration
 * @param settings Integration settings
 */
async function setupQuickBooks(settings: IntegrationSettings): Promise<void> {
  if (!settings.quickbooksEnabled) {
    integrations.quickbooks = null;
    return;
  }

  try {
    integrations.quickbooks = new QuickBooks({
      accessToken: settings.quickbooksAccessToken,
      refreshToken: settings.quickbooksRefreshToken,
      clientId: settings.quickbooksClientId,
      clientSecret: settings.quickbooksClientSecret,
      environment: settings.quickbooksEnvironment,
      realmId: settings.quickbooksRealmId,
    });

    await integrations.quickbooks.initialize();
  } catch (error) {
    console.error('Failed to setup QuickBooks:', error);
    throw new Error('Failed to setup QuickBooks integration');
  }
}

/**
 * Sets up Xero integration
 * @param settings Integration settings
 */
async function setupXero(settings: IntegrationSettings): Promise<void> {
  if (!settings.xeroEnabled) {
    integrations.xero = null;
    return;
  }

  try {
    integrations.xero = new Xero({
      accessToken: settings.xeroAccessToken,
      refreshToken: settings.xeroRefreshToken,
      clientId: settings.xeroClientId,
      clientSecret: settings.xeroClientSecret,
      tenantId: settings.xeroTenantId,
    });

    await integrations.xero.initialize();
  } catch (error) {
    console.error('Failed to setup Xero:', error);
    throw new Error('Failed to setup Xero integration');
  }
}

/**
 * Syncs data with QuickBooks
 * @param options Sync options
 * @returns Sync result
 * @throws Error if sync fails
 */
export async function syncWithQuickBooks(options: SyncOptions = {}): Promise<SyncResult> {
  if (!integrations.quickbooks) {
    throw new Error('QuickBooks integration is not enabled');
  }

  try {
    if (await shouldRefreshToken(integrations.quickbooks)) {
      const newTokens = await integrations.quickbooks.refreshAccessToken();
      await updateIntegrationTokens('quickbooks', newTokens);
    }

    const result = await integrations.quickbooks.sync({
      force: options.forceSync,
      items: options.syncItems,
      dryRun: options.dryRun,
    });

    return result;
  } catch (error) {
    console.error('Failed to sync with QuickBooks:', error);
    throw new Error('Failed to sync with QuickBooks');
  }
}

/**
 * Syncs data with Xero
 * @param options Sync options
 * @returns Sync result
 * @throws Error if sync fails
 */
export async function syncWithXero(options: SyncOptions = {}): Promise<SyncResult> {
  if (!integrations.xero) {
    throw new Error('Xero integration is not enabled');
  }

  try {
    if (await shouldRefreshToken(integrations.xero)) {
      const newTokens = await integrations.xero.refreshAccessToken();
      await updateIntegrationTokens('xero', newTokens);
    }

    const result = await integrations.xero.sync({
      force: options.forceSync,
      items: options.syncItems,
      dryRun: options.dryRun,
    });

    return result;
  } catch (error) {
    console.error('Failed to sync with Xero:', error);
    throw new Error('Failed to sync with Xero');
  }
}

/**
 * Checks if an access token needs to be refreshed
 * @param integration Integration instance
 * @returns true if the token needs to be refreshed
 */
async function shouldRefreshToken(integration: QuickBooks | Xero): Promise<boolean> {
  try {
    const tokenInfo = await integration.getTokenInfo();
    const expiresAt = new Date(tokenInfo.expiresAt);
    const now = new Date();

    // Refresh if less than 5 minutes until expiration
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true;
  }
}

/**
 * Updates integration tokens in the database
 * @param integrationType Type of integration ('quickbooks' or 'xero')
 * @param tokens New token information
 */
async function updateIntegrationTokens(
  integrationType: 'quickbooks' | 'xero',
  tokens: TokenInfo,
): Promise<void> {
  try {
    const settings = await getIntegrationSettings();
    if (integrationType === 'quickbooks') {
      settings.quickbooksAccessToken = tokens.accessToken;
      settings.quickbooksRefreshToken = tokens.refreshToken;
    } else {
      settings.xeroAccessToken = tokens.accessToken;
      settings.xeroRefreshToken = tokens.refreshToken;
    }
    await updateIntegrationSettings(settings);
  } catch (error) {
    console.error(`Failed to update ${integrationType} tokens:`, error);
    throw new Error(`Failed to update ${integrationType} tokens`);
  }
}

/**
 * Disconnects all integrations
 */
export async function disconnectIntegrations(): Promise<void> {
  try {
    await Promise.all([disconnectIntegration('quickbooks'), disconnectIntegration('xero')]);
  } catch (error) {
    console.error('Failed to disconnect integrations:', error);
    throw new Error('Failed to disconnect integrations');
  }
}

/**
 * Disconnects a specific integration
 * @param integrationType Type of integration to disconnect
 */
async function disconnectIntegration(integrationType: 'quickbooks' | 'xero'): Promise<void> {
  const integration = integrations[integrationType];
  if (integration) {
    try {
      await integration.disconnect();
      integrations[integrationType] = null;

      const settings = await getIntegrationSettings();
      if (integrationType === 'quickbooks') {
        settings.quickbooksEnabled = false;
        settings.quickbooksAccessToken = '';
        settings.quickbooksRefreshToken = '';
      } else {
        settings.xeroEnabled = false;
        settings.xeroAccessToken = '';
        settings.xeroRefreshToken = '';
      }
      await updateIntegrationSettings(settings);
    } catch (error) {
      console.error(`Failed to disconnect ${integrationType}:`, error);
      throw new Error(`Failed to disconnect ${integrationType}`);
    }
  }
}

/**
 * Checks the status of integrations
 * @returns Status of each integration
 */
export function getIntegrationStatus(): Record<string, boolean> {
  return {
    quickbooks: integrations.quickbooks !== null,
    xero: integrations.xero !== null,
  };
}

// Disconnect integrations when the app is closed
process.on('exit', () => {
  disconnectIntegrations().catch(console.error);
});

export type { SyncOptions, SyncResult, TokenInfo };
