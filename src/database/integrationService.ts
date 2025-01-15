import knex from './db';
import { IntegrationSettings } from '../shared/types/integration';

export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  const result = await knex('integrationSettings').first();
  return result ? mapIntegrationSettings(result) : getDefaultIntegrationSettings();
}

export async function updateIntegrationSettings(settings: IntegrationSettings): Promise<void> {
  const existingSettings = await knex('integrationSettings').first();
  if (existingSettings) {
    await knex('integrationSettings').update(settings);
  } else {
    await knex('integrationSettings').insert(settings);
  }
}

export async function syncWithQuickbooks(): Promise<void> {
  // Implement Quickbooks sync logic here
  console.log('Syncing with Quickbooks...');
}

export async function syncWithXero(): Promise<void> {
  // Implement Xero sync logic here
  console.log('Syncing with Xero...');
}

function mapIntegrationSettings(result: any): IntegrationSettings {
  return {
    quickbooksEnabled: result.quickbooksEnabled,
    quickbooksAccessToken: result.quickbooksAccessToken,
    quickbooksRefreshToken: result.quickbooksRefreshToken,
    xeroEnabled: result.xeroEnabled,
    xeroAccessToken: result.xeroAccessToken,
    xeroRefreshToken: result.xeroRefreshToken,
  };
}

function getDefaultIntegrationSettings(): IntegrationSettings {
  return {
    quickbooksEnabled: false,
    quickbooksAccessToken: '',
    quickbooksRefreshToken: '',
    xeroEnabled: false,
    xeroAccessToken: '',
    xeroRefreshToken: '',
  };
}
