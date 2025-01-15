import knex from './db'
import { IntegrationSettings } from '../shared/types/integration'

export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  const settings = await knex('integration_settings').first()
  return (
    settings || {
      quickbooks_enabled: false,
      quickbooks_access_token: '',
      quickbooks_refresh_token: '',
      xero_enabled: false,
      xero_access_token: '',
      xero_refresh_token: '',
    }
  )
}

export async function updateIntegrationSettings(settings: IntegrationSettings): Promise<void> {
  const existingSettings = await knex('integration_settings').first()
  if (existingSettings) {
    await knex('integration_settings').update(settings)
  } else {
    await knex('integration_settings').insert(settings)
  }
}

export async function syncWithQuickbooks(): Promise<void> {
  // Implement Quickbooks sync logic here
  console.log('Syncing with Quickbooks...')
}

export async function syncWithXero(): Promise<void> {
  // Implement Xero sync logic here
  console.log('Syncing with Xero...')
}
