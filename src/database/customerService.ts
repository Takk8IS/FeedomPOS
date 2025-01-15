import knex from './db';
import { Customer } from '../shared/types/customer';

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'createdAt'>,
): Promise<number> {
  const [id] = await knex('customers').insert({
    ...customer,
    createdAt: new Date(),
  });

  if (!id) {
    throw new Error('Failed to create customer');
  }

  return id;
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const result = await knex('customers').where('id', id).first();
  return result ? mapCustomer(result) : null;
}

export async function updateCustomer(customer: Customer): Promise<void> {
  const { id, ...updateData } = customer;
  await knex('customers').where('id', id).update(updateData);
}

export async function deleteCustomer(id: number): Promise<void> {
  await knex('customers').where('id', id).delete();
}

export async function searchCustomers(term: string): Promise<Customer[]> {
  const results = await knex('customers')
    .where('name', 'like', `%${term}%`)
    .orWhere('email', 'like', `%${term}%`)
    .orWhere('phone', 'like', `%${term}%`);
  return results.map(mapCustomer);
}

export async function getAllCustomers(): Promise<Customer[]> {
  const results = await knex('customers').select('*');
  return results.map(mapCustomer);
}

function mapCustomer(result: any): Customer {
  return {
    id: result.id,
    name: result.name,
    email: result.email,
    phone: result.phone,
    address: result.address,
    createdAt: result.createdAt,
  };
}
