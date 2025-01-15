import knex from './db';
import { Account, AccountType } from '../shared/types/account';

export async function createAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<number> {
  const [id] = await knex('accounts').insert({
    ...account,
    createdAt: new Date(),
  });
  return id ?? 0;
}

export async function getAccountById(id: number): Promise<Account | null> {
  const result = await knex('accounts').where('id', id).first();
  return result
    ? {
        id: result.id,
        customerId: result.customerId,
        supplierId: result.supplierId,
        type: result.type as AccountType,
        amount: result.amount,
        dueDate: result.dueDate,
        paidAt: result.paidAt,
        createdAt: result.createdAt,
      }
    : null;
}

export async function updateAccount(account: Account): Promise<void> {
  const { id, ...updateData } = account;
  await knex('accounts').where('id', id).update(updateData);
}

export async function deleteAccount(id: number): Promise<void> {
  await knex('accounts').where('id', id).delete();
}

export async function getAccountsByCustomer(customerId: number): Promise<Account[]> {
  const results = await knex('accounts').where('customerId', customerId);
  return results.map(
    (result): Account => ({
      id: result.id,
      customerId: result.customerId,
      supplierId: result.supplierId,
      type: result.type as AccountType,
      amount: result.amount,
      dueDate: result.dueDate,
      paidAt: result.paidAt,
      createdAt: result.createdAt,
    }),
  );
}

export async function getAccountsBySupplier(supplierId: number): Promise<Account[]> {
  const results = await knex('accounts').where('supplierId', supplierId);
  return results.map(
    (result): Account => ({
      id: result.id,
      customerId: result.customerId,
      supplierId: result.supplierId,
      type: result.type as AccountType,
      amount: result.amount,
      dueDate: result.dueDate,
      paidAt: result.paidAt,
      createdAt: result.createdAt,
    }),
  );
}

export async function getOverdueAccounts(): Promise<Account[]> {
  const today = new Date();
  const results = await knex('accounts').where('dueDate', '<', today).andWhere('paidAt', null);
  return results.map(
    (result): Account => ({
      id: result.id,
      customerId: result.customerId,
      supplierId: result.supplierId,
      type: result.type as AccountType,
      amount: result.amount,
      dueDate: result.dueDate,
      paidAt: result.paidAt,
      createdAt: result.createdAt,
    }),
  );
}

export async function markAccountAsPaid(id: number): Promise<void> {
  await knex('accounts').where('id', id).update({ paidAt: new Date() });
}

export async function getTotalReceivables(): Promise<number> {
  const result = await knex('accounts')
    .where('type', 'receivable')
    .andWhere('paidAt', null)
    .sum('amount as total')
    .first();
  return result?.total ?? 0;
}

export async function getTotalPayables(): Promise<number> {
  const result = await knex('accounts')
    .where('type', 'payable')
    .andWhere('paidAt', null)
    .sum('amount as total')
    .first();
  return result?.total ?? 0;
}
