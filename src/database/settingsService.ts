import knex from './db'

export interface Settings {
  businessName: string
  businessAddress: string
  taxRate: number
  currency: string
  language: string
  lowStockThreshold: number
  theme: 'light' | 'dark'
  printerType: string
  printerName: string
  useCashDrawer: boolean
  cashDrawerPort: string
  guarantee?: string
  invoiceMessage?: string
  receiptFooter?: string
  supportEmail?: string
  supportPhone?: string
}

export async function getSettings(): Promise<Settings> {
  const settings = await knex('settings').first()
  return (
    settings || {
      businessName: '',
      businessAddress: '',
      taxRate: 18,
      currency: 'USD',
      language: 'en',
      lowStockThreshold: 10,
      theme: 'light',
      printerType: 'thermal',
      printerName: '',
      useCashDrawer: false,
      cashDrawerPort: '',
      guarantee: '',
      invoiceMessage: '',
    }
  )
}

export async function updateSettings(settings: Settings): Promise<void> {
  const existingSettings = await knex('settings').first()
  if (existingSettings) {
    await knex('settings').update(settings)
  } else {
    await knex('settings').insert(settings)
  }
}

// Initialize settings table if it doesn't exist
export async function initializeSettings(): Promise<void> {
  const tableExists = await knex.schema.hasTable('settings')
  if (!tableExists) {
    await knex.schema.createTable('settings', (table) => {
      table.string('businessName')
      table.string('businessAddress')
      table.float('taxRate')
      table.string('currency')
      table.string('language')
      table.integer('lowStockThreshold')
      table.string('theme')
      table.string('printerType')
      table.string('printerName')
      table.boolean('useCashDrawer')
      table.string('cashDrawerPort')
      table.string('guarantee')
      table.string('invoiceMessage')
    })

    // Insert default settings
    await knex('settings').insert({
      businessName: 'My Business',
      businessAddress: '123 Main St, City, Country',
      taxRate: 18,
      currency: 'USD',
      language: 'en',
      lowStockThreshold: 10,
      theme: 'light',
      printerType: 'thermal',
      printerName: '',
      useCashDrawer: false,
      cashDrawerPort: '',
      guarantee: '',
      invoiceMessage: '',
    })
  }
}
