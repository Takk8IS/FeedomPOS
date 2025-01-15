import knex from './db'
import { Customer } from '../shared/types/customer'

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'createdAt'>
): Promise<number> {
  const result = await knex('customers').insert({
    ...customer,
    created_at: new Date(),
  })

  if (!result[0]) {
    throw new Error('Failed to create customer')
  }

  return result[0]
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  return knex('customers').where('id', id).first()
}

export async function updateCustomer(customer: Customer): Promise<void> {
  const { id, ...updateData } = customer
  await knex('customers').where('id', id).update(updateData)
}

export async function deleteCustomer(id: number): Promise<void> {
  await knex('customers').where('id', id).delete()
}

export async function searchCustomers(term: string): Promise<Customer[]> {
  return knex('customers')
    .where('name', 'like', `%${term}%`)
    .orWhere('email', 'like', `%${term}%`)
    .orWhere('phone', 'like', `%${term}%`)
}

export async function getAllCustomers(): Promise<Customer[]> {
  return knex('customers').select('*')
}
