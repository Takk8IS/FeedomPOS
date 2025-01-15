import Knex from 'knex'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const USER_DATA_PATH = app.getPath('userData')
const DB_PATH = path.join(USER_DATA_PATH, 'freedom_pos.sqlite')

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: DB_PATH,
  },
  useNullAsDefault: true,
})

export default knex

// Database schema setup
export async function setupDatabase() {
  // Create tables if they don't exist
  await knex.schema.hasTable('products').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('products', (table) => {
        table.increments('id').primary()
        table.string('name').notNullable()
        table.string('barcode').unique()
        table.decimal('price', 10, 2).notNullable()
        table.integer('stock').notNullable().defaultTo(0)
        table.integer('lowStockThreshold').notNullable().defaultTo(10)
        table.string('category').notNullable()
        table.boolean('taxExempt').notNullable().defaultTo(false)
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('categories').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('categories', (table) => {
        table.increments('id').primary()
        table.string('name').notNullable().unique()
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('discounts').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('discounts', (table) => {
        table.increments('id').primary()
        table.integer('product_id').unsigned().references('id').inTable('products')
        table.decimal('percentage', 5, 2).notNullable()
        table.dateTime('start_date').notNullable()
        table.dateTime('end_date').notNullable()
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('sales').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('sales', (table) => {
        table.increments('id').primary()
        table.decimal('total', 10, 2).notNullable()
        table.decimal('subtotal', 10, 2).notNullable()
        table.decimal('tax', 10, 2).notNullable()
        table.string('payment_method').notNullable()
        table.integer('customer_id').unsigned().references('id').inTable('customers')
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('sale_items').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('sale_items', (table) => {
        table.increments('id').primary()
        table.integer('sale_id').unsigned().references('id').inTable('sales')
        table.integer('product_id').unsigned().references('id').inTable('products')
        table.integer('quantity').notNullable()
        table.decimal('price', 10, 2).notNullable()
        table.decimal('discount', 10, 2).notNullable().defaultTo(0)
        table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0)
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('users').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('users', (table) => {
        table.increments('id').primary()
        table.string('username').notNullable().unique()
        table.string('password').notNullable()
        table.enu('role', ['admin', 'manager', 'cashier', 'accountant']).notNullable()
        table.dateTime('last_login')
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('customers').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('customers', (table) => {
        table.increments('id').primary()
        table.string('name').notNullable()
        table.string('email')
        table.string('phone')
        table.string('address')
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('accounts').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('accounts', (table) => {
        table.increments('id').primary()
        table.integer('customer_id').unsigned().references('id').inTable('customers')
        table.integer('supplier_id').unsigned().references('id').inTable('suppliers')
        table.enu('type', ['receivable', 'payable']).notNullable()
        table.decimal('amount', 10, 2).notNullable()
        table.date('due_date').notNullable()
        table.dateTime('paid_at')
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('quotes').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('quotes', (table) => {
        table.increments('id').primary()
        table.integer('customer_id').unsigned().references('id').inTable('customers')
        table.decimal('subtotal', 10, 2).notNullable()
        table.decimal('tax', 10, 2).notNullable()
        table.decimal('total', 10, 2).notNullable()
        table.dateTime('expires_at').notNullable()
        table.text('notes')
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('quote_items').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('quote_items', (table) => {
        table.increments('id').primary()
        table.integer('quote_id').unsigned().references('id').inTable('quotes')
        table.integer('product_id').unsigned().references('id').inTable('products')
        table.integer('quantity').notNullable()
        table.decimal('price', 10, 2).notNullable()
        table.decimal('discount', 10, 2).notNullable().defaultTo(0)
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('appointments').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('appointments', (table) => {
        table.increments('id').primary()
        table.integer('customer_id').unsigned().references('id').inTable('customers')
        table.integer('service_id').unsigned().references('id').inTable('products')
        table.dateTime('date').notNullable()
        table.integer('duration').notNullable()
        table.enu('status', ['scheduled', 'completed', 'cancelled']).notNullable()
        table.string('notes')
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('refunds').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('refunds', (table) => {
        table.increments('id').primary()
        table.integer('sale_id').unsigned().references('id').inTable('sales')
        table.decimal('amount', 10, 2).notNullable()
        table.string('reason').notNullable()
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('subscriptions').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('subscriptions', (table) => {
        table.increments('id').primary()
        table.integer('customer_id').unsigned().references('id').inTable('customers')
        table.string('plan_type').notNullable()
        table.date('start_date').notNullable()
        table.date('end_date').notNullable()
        table.enu('status', ['active', 'cancelled', 'expired']).notNullable()
        table.timestamps(true, true)
      })
    }
  })

  await knex.schema.hasTable('settings').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('settings', (table) => {
        table.increments('id').primary()
        table.string('business_name').notNullable()
        table.string('business_address').notNullable()
        table.decimal('tax_rate', 5, 2).notNullable()
        table.string('currency').notNullable()
        table.string('language').notNullable()
        table.integer('low_stock_threshold').notNullable()
        table.string('receipt_footer')
        table.string('invoice_footer')
        table.string('theme').notNullable()
        table.boolean('use_barcode_scanner').notNullable().defaultTo(true)
        table.boolean('use_cash_drawer').notNullable().defaultTo(true)
        table.string('printer_type').notNullable()
        table.string('support_email')
        table.string('support_phone')
      })
    }
  })

  // Initialize settings if not exist
  const settingsExist = await knex('settings').first()
  if (!settingsExist) {
    await knex('settings').insert({
      business_name: 'My Business',
      business_address: '123 Main St, City, Country',
      tax_rate: 18,
      currency: 'USD',
      language: 'en',
      low_stock_threshold: 10,
      theme: 'light',
      printer_type: '80mm',
      use_barcode_scanner: true,
      use_cash_drawer: true,
    })
  }
}

export async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(USER_DATA_PATH, 'backups')
  const backupPath = path.join(backupDir, `freedom_pos_backup_${timestamp}.sqlite`)

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  await new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(DB_PATH)
    const writeStream = fs.createWriteStream(backupPath)

    readStream.on('error', reject)
    writeStream.on('error', reject)
    writeStream.on('finish', resolve)

    readStream.pipe(writeStream)
  })

  console.log(`Database backed up to: ${backupPath}`)
}
