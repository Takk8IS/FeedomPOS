import Knex from 'knex';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const USER_DATA_PATH = app.getPath('userData');
const DB_PATH = path.join(USER_DATA_PATH, 'freedom_pos.sqlite');

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: DB_PATH,
  },
  useNullAsDefault: true,
});

export default knex;

// Database schema setup
export async function setupDatabase(): Promise<void> {
  // Create tables if they don't exist
  await createTableIfNotExists('products', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('barcode').unique();
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock').notNullable().defaultTo(0);
    table.integer('lowStockThreshold').notNullable().defaultTo(10);
    table.string('category').notNullable();
    table.boolean('taxExempt').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  await createTableIfNotExists('categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.timestamps(true, true);
  });

  await createTableIfNotExists('discounts', (table) => {
    table.increments('id').primary();
    table.integer('productId').unsigned().references('id').inTable('products');
    table.decimal('percentage', 5, 2).notNullable();
    table.dateTime('startDate').notNullable();
    table.dateTime('endDate').notNullable();
    table.timestamps(true, true);
  });

  await createTableIfNotExists('sales', (table) => {
    table.increments('id').primary();
    table.decimal('total', 10, 2).notNullable();
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax', 10, 2).notNullable();
    table.string('paymentMethod').notNullable();
    table.integer('customerId').unsigned().references('id').inTable('customers');
    table.timestamps(true, true);
  });

  await createTableIfNotExists('saleItems', (table) => {
    table.increments('id').primary();
    table.integer('saleId').unsigned().references('id').inTable('sales');
    table.integer('productId').unsigned().references('id').inTable('products');
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.decimal('discount', 10, 2).notNullable().defaultTo(0);
    table.decimal('taxAmount', 10, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await createTableIfNotExists('users', (table) => {
    table.increments('id').primary();
    table.string('username').notNullable().unique();
    table.string('password').notNullable();
    table.enu('role', ['admin', 'manager', 'cashier', 'accountant']).notNullable();
    table.dateTime('lastLogin');
    table.timestamps(true, true);
  });

  await createTableIfNotExists('customers', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email');
    table.string('phone');
    table.string('address');
    table.timestamps(true, true);
  });

  await createTableIfNotExists('accounts', (table) => {
    table.increments('id').primary();
    table.integer('customerId').unsigned().references('id').inTable('customers');
    table.integer('supplierId').unsigned().references('id').inTable('suppliers');
    table.enu('type', ['receivable', 'payable']).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.date('dueDate').notNullable();
    table.dateTime('paidAt');
    table.timestamps(true, true);
  });

  await createTableIfNotExists('quotes', (table) => {
    table.increments('id').primary();
    table.integer('customerId').unsigned().references('id').inTable('customers');
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax', 10, 2).notNullable();
    table.decimal('total', 10, 2).notNullable();
    table.dateTime('expiresAt').notNullable();
    table.text('notes');
    table.timestamps(true, true);
  });

  await createTableIfNotExists('quoteItems', (table) => {
    table.increments('id').primary();
    table.integer('quoteId').unsigned().references('id').inTable('quotes');
    table.integer('productId').unsigned().references('id').inTable('products');
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.decimal('discount', 10, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await createTableIfNotExists('appointments', (table) => {
    table.increments('id').primary();
    table.integer('customerId').unsigned().references('id').inTable('customers');
    table.integer('serviceId').unsigned().references('id').inTable('products');
    table.dateTime('date').notNullable();
    table.integer('duration').notNullable();
    table.enu('status', ['scheduled', 'completed', 'cancelled']).notNullable();
    table.string('notes');
    table.timestamps(true, true);
  });

  await createTableIfNotExists('refunds', (table) => {
    table.increments('id').primary();
    table.integer('saleId').unsigned().references('id').inTable('sales');
    table.decimal('amount', 10, 2).notNullable();
    table.string('reason').notNullable();
    table.timestamps(true, true);
  });

  await createTableIfNotExists('subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('customerId').unsigned().references('id').inTable('customers');
    table.string('planType').notNullable();
    table.date('startDate').notNullable();
    table.date('endDate').notNullable();
    table.enu('status', ['active', 'cancelled', 'expired']).notNullable();
    table.timestamps(true, true);
  });

  await createTableIfNotExists('settings', (table) => {
    table.increments('id').primary();
    table.string('businessName').notNullable();
    table.string('businessAddress').notNullable();
    table.decimal('taxRate', 5, 2).notNullable();
    table.string('currency').notNullable();
    table.string('language').notNullable();
    table.integer('lowStockThreshold').notNullable();
    table.string('receiptFooter');
    table.string('invoiceFooter');
    table.string('theme').notNullable();
    table.boolean('useBarcodeScanner').notNullable().defaultTo(true);
    table.boolean('useCashDrawer').notNullable().defaultTo(true);
    table.string('printerType').notNullable();
    table.string('supportEmail');
    table.string('supportPhone');
  });

  // Initialize settings if not exist
  const settingsExist = await knex('settings').first();
  if (!settingsExist) {
    await knex('settings').insert({
      businessName: 'My Business',
      businessAddress: '123 Main St, City, Country',
      taxRate: 18,
      currency: 'USD',
      language: 'en',
      lowStockThreshold: 10,
      theme: 'light',
      printerType: '80mm',
      useBarcodeScanner: true,
      useCashDrawer: true,
    });
  }
}

async function createTableIfNotExists(
  tableName: string,
  tableBuilder: (table: Knex.CreateTableBuilder) => void,
): Promise<void> {
  const exists = await knex.schema.hasTable(tableName);
  if (!exists) {
    await knex.schema.createTable(tableName, tableBuilder);
  }
}

export async function backupDatabase(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(USER_DATA_PATH, 'backups');
  const backupPath = path.join(backupDir, `freedom_pos_backup_${timestamp}.sqlite`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  await new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(DB_PATH);
    const writeStream = fs.createWriteStream(backupPath);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    readStream.pipe(writeStream);
  });

  console.log(`Database backed up to: ${backupPath}`);
}
