import knex from './db'
import { Subscription } from '../shared/types/subscription'

export async function createSubscription(subscription: Omit<Subscription, 'id'>): Promise<number> {
  const [id] = await knex('subscriptions').insert(subscription)
  return id ?? 0
}

export async function getSubscriptionById(id: number): Promise<Subscription | null> {
  return knex('subscriptions').where('id', id).first()
}

export async function updateSubscription(subscription: Subscription): Promise<void> {
  await knex('subscriptions').where('id', subscription.id).update(subscription)
}

export async function deleteSubscription(id: number): Promise<void> {
  await knex('subscriptions').where('id', id).delete()
}
